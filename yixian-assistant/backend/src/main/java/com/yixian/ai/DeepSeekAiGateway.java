package com.yixian.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeepSeekAiGateway implements AiGateway {

    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;

    @Value("${deepseek.base-url:https://api.deepseek.com}")
    private String baseUrl;

    @Value("${deepseek.api-key:}")
    private String apiKey;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

    @Override
    public Map<String, Object> extract(String input, String applicationType) {
        if (!hasApiKey()) {
            return localExtract(input, applicationType, "本地规则解析");
        }
        try {
            String prompt = """
                    按翼线助手接口契约从用户文本抽取申请字段。只返回 JSON：
                    {"fields":{},"missingFields":[],"warnings":[],"confidence":0.0}
                    applicationType=%s
                    input=%s
                    MATERIAL 字段包括 title/content/location/expectedTime/urgency/materials。
                    VISIT 字段包括 customerName/purpose/location/expectedTime/contactName/needSupport/supportContent。
                    时间格式必须为 yyyy-MM-dd HH:mm:ss；无法确定时返回 null，并在 missingFields 标记。
                    """.formatted(applicationType, input);
            String content = complete(List.of(Map.of("role", "user", "content", prompt)), true);
            return objectMapper.readValue(stripJsonFence(content), new TypeReference<Map<String, Object>>() {});
        } catch (Exception exception) {
            log.warn("DeepSeek extract failed, fallback to local parser: {}", exception.getMessage());
            return localExtract(input, applicationType, "本地规则解析（DeepSeek不可用）");
        }
    }

    @Override
    public Map<String, Object> chat(String message, List<Map<String, String>> history) {
        if (!hasApiKey()) {
            return localChat(message, "本地知识库");
        }
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of(
                    "role", "system",
                    "content", "你是翼线助手。只回答企业一线装维、拜访、领料、商机和支撑流程问题；不确定时明确建议联系主管。回答要简洁、可执行。"
            ));
            if (history != null) {
                messages.addAll(history.stream()
                        .filter(item -> item.get("role") != null && item.get("content") != null)
                        .limit(10)
                        .toList());
            }
            messages.add(Map.of("role", "user", "content", message));

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("answer", complete(messages, false));
            result.put("source", "翼线助手知识库与 DeepSeek");
            result.put("confidence", 0.82);
            result.put("suggestedAction", suggestedAction(message));
            return result;
        } catch (Exception exception) {
            log.warn("DeepSeek chat failed, fallback to local knowledge: {}", exception.getMessage());
            return localChat(message, "本地知识库（DeepSeek不可用）");
        }
    }

    @Override
    public Map<String, Object> query(String question, String sessionId, Map<String, Object> context) {
        if (!hasApiKey()) {
            return localManagementQuery(question, context, "本地管理指标快照");
        }
        try {
            String contextJson = objectMapper.writeValueAsString(context == null ? Map.of() : context);
            List<Map<String, String>> messages = List.of(
                    Map.of(
                            "role", "system",
                            "content", """
                                    你是翼线助手 PC 后台的 AI 管理智脑。
                                    只能根据用户已授权的数据快照回答，不能声称直接查询数据库，不能执行审批、派单、删除或修改等写操作。
                                    输出必须是 JSON 对象：
                                    {"text":"回答正文","metric":"可选核心数字","columns":[{"key":"字段","label":"列名"}],"rows":[],"source":"口径说明","confidence":0.0}
                                    如果问题与给定数据无关，请说明可查询范围。
                                    """
                    ),
                    Map.of(
                            "role", "user",
                            "content", "问题：" + safeText(question) + "\n会话：" + safeText(sessionId) + "\n授权数据快照：" + contextJson
                    )
            );
            String content = complete(messages, true);
            Map<String, Object> parsed = objectMapper.readValue(stripJsonFence(content), new TypeReference<Map<String, Object>>() {});
            return normalizeManagementResult(parsed, "DeepSeek 管理智脑 · 仅基于授权指标快照");
        } catch (Exception exception) {
            log.warn("DeepSeek management query failed, fallback to local snapshot: {}", exception.getMessage());
            return localManagementQuery(question, context, "本地管理指标快照（DeepSeek不可用）");
        }
    }

    private boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("your_");
    }

    private String complete(List<Map<String, String>> messages, boolean jsonMode) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", 0.2);
        if (jsonMode) body.put("response_format", Map.of("type", "json_object"));

        JsonNode response = restClientBuilder.baseUrl(baseUrl).build()
                .post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        String content = response == null
                ? ""
                : response.path("choices").path(0).path("message").path("content").asText();
        if (content == null || content.isBlank()) {
            throw new IllegalStateException("DeepSeek response content is empty");
        }
        return content;
    }

    private String stripJsonFence(String text) {
        String value = text == null ? "" : text.trim();
        if (value.startsWith("```")) {
            value = value.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        return value;
    }

    private Map<String, Object> localExtract(String input, String type, String source) {
        String text = input == null ? "" : input;
        String normalizedType = type == null ? "" : type.toUpperCase(Locale.ROOT);
        Map<String, Object> fields = new LinkedHashMap<>();
        List<String> missingFields = new ArrayList<>();
        List<Map<String, String>> warnings = new ArrayList<>();

        if ("MATERIAL".equals(normalizedType)) {
            fields.put("title", guessMaterialTitle(text));
            fields.put("content", text);
            fields.put("location", guessLocation(text));
            fields.put("expectedTime", guessExpectedTime(text));
            fields.put("urgency", isUrgent(text) ? "URGENT" : "NORMAL");
            fields.put("materials", guessMaterials(text));
            if (((List<?>) fields.get("materials")).isEmpty()) {
                missingFields.add("materials");
                warnings.add(Map.of("field", "materials", "message", "未识别到明确物料，请提交前补充数量和单位"));
            }
        } else {
            fields.put("title", "客户拜访");
            fields.put("customerName", guessCustomerName(text));
            fields.put("purpose", text);
            fields.put("location", guessLocation(text));
            fields.put("expectedTime", guessExpectedTime(text));
            fields.put("contactName", "");
            fields.put("needSupport", text.contains("支撑") || text.contains("技术"));
            fields.put("supportContent", text.contains("支撑") ? text : "");
            if (String.valueOf(fields.get("customerName")).isBlank()) {
                missingFields.add("customerName");
                warnings.add(Map.of("field", "customerName", "message", "未识别到客户名称，请提交前补充"));
            }
        }

        if (fields.get("expectedTime") == null) {
            missingFields.add("expectedTime");
            warnings.add(Map.of("field", "expectedTime", "message", "未识别到准确时间，请提交前补充"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fields", fields);
        result.put("missingFields", missingFields);
        result.put("warnings", warnings);
        result.put("confidence", missingFields.isEmpty() ? 0.78 : 0.58);
        result.put("source", source);
        return result;
    }

    private Map<String, Object> localChat(String message, String source) {
        String text = message == null ? "" : message;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answer", localAnswer(text));
        result.put("source", source);
        result.put("confidence", confidence(text));
        result.put("suggestedAction", suggestedAction(text));
        return result;
    }

    private Map<String, Object> localManagementQuery(String question, Map<String, Object> context, String source) {
        String text = question == null ? "" : question;
        Map<String, Object> metrics = nestedMap(context, "metrics");
        List<Map<String, Object>> overduePeople = nestedList(context, "overduePeople");
        List<Map<String, Object>> highIntentCustomers = nestedList(context, "highIntentCustomers");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", source);
        result.put("confidence", 0.68);

        if (containsAny(text, "完成率")) {
            Object rate = metrics.getOrDefault("weeklyCompletionRate", "-");
            Object completed = metrics.getOrDefault("weeklyCompleted", "-");
            Object expected = metrics.getOrDefault("weeklyExpected", "-");
            result.put("text", "本周装维工单完成率如下：");
            result.put("metric", rate + "%");
            result.put("source", "本周已完成 " + completed + " 单 ÷ 应完成 " + expected + " 单，排除已取消任务");
            return result;
        }
        if (containsAny(text, "超时")) {
            result.put("text", "按当前未完成任务统计，超时较多的人员如下：");
            result.put("columns", List.of(
                    Map.of("key", "name", "label", "人员"),
                    Map.of("key", "count", "label", "超时数")
            ));
            result.put("rows", overduePeople);
            result.put("source", "期望完成时间早于当前时间且任务未完成");
            return result;
        }
        if (containsAny(text, "拜访")) {
            Object visits = metrics.getOrDefault("weeklyVisitCount", "-");
            result.put("text", "本周有效拜访次数如下：");
            result.put("metric", visits + " 次");
            result.put("source", "计划时间在本周且状态有效的拜访记录");
            return result;
        }
        if (containsAny(text, "高意向", "客户")) {
            result.put("text", "当前高意向且未签约客户如下：");
            result.put("columns", List.of(
                    Map.of("key", "customer", "label", "客户"),
                    Map.of("key", "amount", "label", "预计金额")
            ));
            result.put("rows", highIntentCustomers);
            result.put("source", "意向等级=高，商机状态不等于已签约");
            return result;
        }
        if (containsAny(text, "转化")) {
            Object conversionRate = metrics.getOrDefault("opportunityConversionRate", "-");
            result.put("text", "当前商机转化率如下：");
            result.put("metric", conversionRate + "%");
            result.put("source", "已签约商机数 ÷ 有效商机总数");
            return result;
        }

        result.put("text", "这个问题暂未命中受控查询范围。你可以询问完成率、超时排行、拜访次数、商机转化或高意向客户。");
        result.put("source", "未执行数据查询");
        result.put("confidence", 0.45);
        return result;
    }

    private Map<String, Object> normalizeManagementResult(Map<String, Object> parsed, String fallbackSource) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("text", firstText(parsed.get("text"), parsed.get("answer"), "我已根据当前授权数据完成分析。"));
        if (parsed.get("metric") != null) result.put("metric", parsed.get("metric"));
        if (parsed.get("columns") instanceof List<?>) result.put("columns", parsed.get("columns"));
        if (parsed.get("rows") instanceof List<?>) result.put("rows", parsed.get("rows"));
        result.put("source", firstText(parsed.get("source"), fallbackSource));
        result.put("confidence", parsed.getOrDefault("confidence", 0.82));
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> nestedMap(Map<String, Object> source, String key) {
        if (source == null || !(source.get(key) instanceof Map<?, ?> value)) return Map.of();
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> nestedList(Map<String, Object> source, String key) {
        if (source == null || !(source.get(key) instanceof List<?> value)) return List.of();
        return (List<Map<String, Object>>) value;
    }

    private String firstText(Object... values) {
        for (Object value : values) {
            if (value != null && !String.valueOf(value).isBlank()) return String.valueOf(value);
        }
        return "";
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private String localAnswer(String text) {
        if (containsAny(text, "领料", "物料", "光猫", "光纤")) {
            return "领料申请建议从“智能填单”进入，说明物料名称、数量、使用地点和期望时间。提交后状态为待审批，PC 后台审批通过后 APP 详情会同步显示审批人和审批时间。";
        }
        if (containsAny(text, "审批", "驳回", "通过", "申请")) {
            return "申请提交后会进入待审批状态。管理员在 PC 审批中心可以查看详情并选择通过或驳回；驳回时需要填写原因，APP 的我的申请和申请详情会同步展示最新状态。";
        }
        if (containsAny(text, "拜访", "客户", "商机")) {
            return "客户拜访类申请需要填写客户名称、拜访目的、时间地点和是否需要技术支撑。信息越完整，后台审批和后续跟进越顺畅。";
        }
        if (containsAny(text, "支撑", "技术")) {
            return "技术支撑申请需要描述客户问题、支撑类型、期望时间和紧急程度。提交后可在我的申请查看审批进度。";
        }
        return "我可以协助查询领料、申请审批、客户拜访、商机跟进和技术支撑流程。你可以直接问“领料怎么申请”或“申请被驳回怎么办”。";
    }

    private double confidence(String text) {
        return containsAny(text, "领料", "物料", "审批", "驳回", "通过", "申请", "拜访", "客户", "商机", "支撑", "技术") ? 0.78 : 0.46;
    }

    private Map<String, String> suggestedAction(String text) {
        if (containsAny(text, "领料", "物料", "光猫", "光纤")) {
            return Map.of("label", "去提领料申请", "route", "/apply/material");
        }
        if (containsAny(text, "拜访", "客户")) {
            return Map.of("label", "去填拜访申请", "route", "/apply/visit");
        }
        if (containsAny(text, "申请", "审批", "驳回", "通过")) {
            return Map.of("label", "查看我的申请", "route", "/applications");
        }
        return null;
    }

    private boolean containsAny(String text, String... words) {
        if (text == null) return false;
        for (String word : words) {
            if (text.contains(word)) return true;
        }
        return false;
    }

    private String guessMaterialTitle(String text) {
        if (containsAny(text, "维修", "修", "故障")) return "现场维修领料";
        if (containsAny(text, "安装", "装机", "开通")) return "现场装维领料";
        return "领料申请";
    }

    private String guessLocation(String text) {
        for (String area : List.of("鼓楼", "江宁", "玄武", "秦淮", "建邺", "雨花", "浦口", "栖霞")) {
            if (text.contains(area)) return "南京市" + area + "区";
        }
        return "";
    }

    private String guessExpectedTime(String text) {
        LocalDate date = null;
        if (text.contains("今天")) date = LocalDate.now();
        if (text.contains("明天")) date = LocalDate.now().plusDays(1);
        if (text.contains("后天")) date = LocalDate.now().plusDays(2);
        if (date == null) return null;
        String time = text.contains("下午") ? "14:00:00" : text.contains("晚上") ? "19:00:00" : "09:00:00";
        return date.format(DateTimeFormatter.ISO_DATE) + " " + time;
    }

    private boolean isUrgent(String text) {
        return containsAny(text, "紧急", "马上", "立即", "尽快", "故障");
    }

    private List<Map<String, Object>> guessMaterials(String text) {
        List<Map<String, Object>> materials = new ArrayList<>();
        addMaterialIfPresent(materials, text, "光猫", "台");
        addMaterialIfPresent(materials, text, "光纤", "根");
        addMaterialIfPresent(materials, text, "网线", "米");
        addMaterialIfPresent(materials, text, "皮线光缆", "米");
        addMaterialIfPresent(materials, text, "路由器", "台");
        return materials;
    }

    private void addMaterialIfPresent(List<Map<String, Object>> materials, String text, String name, String unit) {
        if (!text.contains(name)) return;
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", name);
        item.put("quantity", guessQuantity(text, name));
        item.put("unit", unit);
        materials.add(item);
    }

    private int guessQuantity(String text, String name) {
        int index = text.indexOf(name);
        String before = index <= 0 ? "" : text.substring(Math.max(0, index - 6), index);
        if (containsAny(before, "两", "2", "二")) return 2;
        if (containsAny(before, "三", "3")) return 3;
        if (containsAny(before, "四", "4")) return 4;
        if (containsAny(before, "五", "5")) return 5;
        return 1;
    }

    private String guessCustomerName(String text) {
        for (String marker : List.of("拜访", "去", "客户")) {
            int index = text.indexOf(marker);
            if (index >= 0 && index + marker.length() < text.length()) {
                String value = text.substring(index + marker.length()).trim();
                return value.split("[，,。\\s]")[0];
            }
        }
        return "";
    }
}
