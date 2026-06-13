package com.zhiwei.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhiwei.common.exception.BusinessException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class DeepSeekAiGateway implements AiGateway {
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;

    @Value("${zhiwei.deepseek.base-url}")
    private String baseUrl;

    @Value("${zhiwei.deepseek.api-key}")
    private String apiKey;

    @Value("${zhiwei.deepseek.model}")
    private String model;

    @Override
    public Map<String, Object> extract(String input, String applicationType) {
        if (apiKey == null || apiKey.isBlank()) {
            return localExtract(input, applicationType);
        }
        String typeSpecificRules = switch (applicationType != null ? applicationType : "") {
            case "MATERIAL" -> """
                1. location: 从文本中抽取完整地址（省市区/县/路/号/街道），没有地址就留空字符串，不要猜测
                2. materials: 抽取物料名称和数量。中文数字需转换（一=1，两=2，三=3...）。常见物料：光猫、光纤、企业网关、网线、路由器、摄像头、智屏、机顶盒、FTTR、交换机、电源、标签纸、水晶头。如无法识别物料，返回空数组
                3. expectedTime: 从明天/后天/今天/周X/下周一等相对时间计算具体日期，无时间则为null
                4. urgency: 包含"紧急/加急/尽快"则为URGENT，否则NORMAL
                """;
            case "VISIT", "SUPPORT" -> """
                1. customerName: 抽取客户名称（公司名含公司/集团/科技/网络等后缀，或人名含先生/女士/总/经理）
                2. purpose: 抽取拜访目的（谈/沟通/签约/维护/勘察/推广等关键词上下文）
                3. expectedTime: 同MATERIAL规则
                4. location: 同MATERIAL规则
                5. needSupport: 是否包含"支撑/技术支持/带技术/方案支持"
                6. supportContent: 支撑需求具体描述
                """;
            case "OPPORTUNITY" -> """
                1. customerName: 同上规则
                2. title: 商机名称（升级/扩容/新建/接入/部署/改造/项目等关键词上下文）
                3. intentLevel: HIGH(A类/高意向), MEDIUM(B类/中等), LOW(C类/低意向)
                4. estimatedAmount: 预计金额，单位分（12万=1200000，5000元=500000）
                5. nextContactTime: 下次联系时间，格式yyyy-MM-dd HH:mm:ss
                6. description: 商机描述（可用原始输入）
                """;
            default -> "";
        };
        String prompt = """
                从用户文本中精确抽取字段。**不要使用默认值**，只从文本中提取。
                applicationType=%s
                input=%s

                抽取规则：
                %s

                只返回 JSON，格式：
                {"fields":{},"missingFields":[],"warnings":[],"confidence":0.0}
                时间格式必须为 yyyy-MM-dd HH:mm:ss。
                confidence 根据字段完整度估算：大部分字段有值则0.8+，少部分有值则0.5-0.7，几乎都没有则0.3以下。
                """.formatted(applicationType, input, typeSpecificRules);
        String content = complete(List.of(Map.of("role", "user", "content", prompt)), true);
        try {
            return objectMapper.readValue(content, new TypeReference<>() {});
        } catch (Exception exception) {
            throw new BusinessException(2001, "AI 字段抽取结果不可解析，已切换手工填写");
        }
    }

    @Override
    public Map<String, Object> chat(String message, List<Map<String, String>> history) {
        if (apiKey == null || apiKey.isBlank()) {
            return localChat(message);
        }
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
                "role", "system",
                "content", """
                        你是翼线助手，电信一线员工（装维人员、客户经理）的智能助手。你可以回答：
                        1. 装维任务流程：接单、开始工作、完工反馈
                        2. 领料申请、拜访申请、支撑申请
                        3. 套餐推荐——基于二季度暑促政策、云享套餐、智选云套餐
                        4. 商机创建与管理

                        套餐知识速查（二季度暑促）：
                        - ★179元：140G/800分钟/2000M宽带，FTTR(1+1)+智屏，重点推荐
                        - 239元：180G/1000分钟/2000M，FTTR+智屏+天翼看家
                        - 199元：160G/1000分钟/2000M，FTTR+智屏
                        - 199夺旗(全新用户)：200G/1500分钟/2000M，FTTR+智屏+天翼看家
                        - ★149夺旗(全新用户)：120G/1000分钟/1000M，FTTR1主1从+中屏
                        - 139夺旗(全新用户)：120G/1000分钟/1000M，FTTR+天翼看家
                        - 139元：70G/500分钟/1000M
                        - 109元：50G/500分钟/500M
                        - ★89夺旗(全新用户)：60G/500分钟/500M
                        - 89元：50G/500分钟/500M
                        - 69元：30G/400分钟/200M

                        关键规则：
                        - 夺旗套餐仅限全新用户（6.4上架）
                        - 迁改提值>0可改云享套餐，提值>20可改新装智选云套餐
                        - 迁改提值≥10送路由器/摄像头，≥20送智屏，≥30送FTTR
                        - 云享169及以下加装副卡不可扩容流量
                        - 智选云169+档支持同城宽带20元纳入满减

                        根据客户预算、新老用户、使用需求推荐合适的套餐。
                        不确定时明确建议联系业务主管。
                        """
        ));
        if (history != null) messages.addAll(history);
        messages.add(Map.of("role", "user", "content", message));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answer", complete(messages, false));
        result.put("source", "翼线助手知识库与 DeepSeek");
        result.put("confidence", 0.82);
        result.put("suggestedAction", null);
        return result;
    }

    private String complete(List<Map<String, String>> messages, boolean jsonMode) {
        try {
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
            return response.path("choices").path(0).path("message").path("content").asText();
        } catch (Exception exception) {
            throw new BusinessException(2001, "AI 服务不可用，已降级");
        }
    }

    private Map<String, Object> localExtract(String input, String type) {
        Map<String, Object> fields = new LinkedHashMap<>();
        List<String> missingFields = new ArrayList<>();
        List<Map<String, String>> warnings = new ArrayList<>();

        String location = extractLocation(input);
        String expectedTime = extractTime(input);

        if ("MATERIAL".equals(type)) {
            fields.put("title", input.contains("维修") || input.contains("修") || input.contains("故障") ? "宽带故障维修" : "现场装维领料");
            fields.put("content", input);
            fields.put("expectedTime", expectedTime);
            fields.put("location", location);
            fields.put("urgency", input.contains("紧急") || input.contains("加急") || input.contains("尽快") ? "URGENT" : "NORMAL");

            List<Map<String, Object>> materials = extractMaterialsLocal(input);
            fields.put("materials", materials);

            if (location.isEmpty()) missingFields.add("location");
            if (materials.isEmpty()) {
                missingFields.add("materials");
                warnings.add(Map.of("field", "materials", "message", "未能识别物料信息，请手工补充"));
            }
            if (expectedTime == null) missingFields.add("expectedTime");
        } else if ("VISIT".equals(type) || "SUPPORT".equals(type)) {
            String customerName = extractCustomerNameLocal(input);
            String purpose = extractPurposeLocal(input);
            boolean needSupport = input.contains("支撑") || input.contains("技术支持") || input.contains("带技术");

            fields.put("customerName", customerName);
            fields.put("purpose", purpose.isEmpty() ? input : purpose);
            fields.put("content", input);
            fields.put("expectedTime", expectedTime);
            fields.put("location", location);
            fields.put("contactName", "");
            fields.put("needSupport", needSupport);
            fields.put("supportContent", needSupport ? "需要技术支撑" : "");

            if (customerName.isEmpty()) missingFields.add("customerName");
            if (purpose.isEmpty()) missingFields.add("purpose");
            if (expectedTime == null) missingFields.add("expectedTime");
        } else if ("OPPORTUNITY".equals(type)) {
            String customerName = extractCustomerNameLocal(input);
            String title = extractOpportunityTitleLocal(input);
            String intentLevel = extractIntentLevelLocal(input);
            Long amount = extractAmountLocal(input);

            fields.put("customerName", customerName);
            fields.put("title", title.isEmpty() ? input : title);
            fields.put("content", input);
            fields.put("intentLevel", intentLevel);
            fields.put("estimatedAmount", amount);
            fields.put("nextContactTime", expectedTime);
            fields.put("description", input);

            if (customerName.isEmpty()) missingFields.add("customerName");
            if (title.isEmpty()) missingFields.add("title");
            if (amount == null) warnings.add(Map.of("field", "estimatedAmount", "message", "未能识别金额，请手工填写"));
        } else {
            fields.put("content", input);
            missingFields.add("applicationType");
        }

        if (expectedTime == null && !missingFields.contains("expectedTime"))
            warnings.add(Map.of("field", "expectedTime", "message", "请补充准确时间"));

        double confidence = missingFields.isEmpty() ? 0.85 : missingFields.size() <= 2 ? 0.6 : 0.4;

        return Map.of(
                "fields", fields,
                "missingFields", missingFields,
                "warnings", warnings,
                "confidence", confidence
        );
    }

    private Map<String, Object> localChat(String message) {
        // 套餐知识库匹配
        if (message.contains("套餐") || message.contains("推荐") || message.contains("资费")
                || message.contains("暑促") || message.contains("夺旗") || message.contains("云享")
                || message.contains("智选云") || message.contains("迁改")) {

            String answer;
            if (message.contains("预算")) {
                answer = "按预算推荐套餐：100元以下→89元/89夺旗；100-150元→109/139/149夺旗；150-200元→179/199夺旗；200元以上→239。具体请告知客户新老用户情况。";
            } else if (message.contains("暑促") || message.contains("夺旗")) {
                answer = "二季度暑促夺旗套餐（仅全新用户）：★149夺旗(120G/1000M)、199夺旗(200G/2000M)、139夺旗(120G/1000M)、★89夺旗(60G/500M)。非夺旗★179元(140G/2000M)重点推荐。";
            } else if (message.contains("云享")) {
                answer = "云享套餐（迁改专用）：119元起(50G/500M)，最高359元(180G/2000M)。迁改提值≥10送路由器/摄像头，≥20送智屏，≥30送FTTR。";
            } else if (message.contains("智选云")) {
                answer = "智选云套餐（迁改提值>20可更换）：89元起(40G/500M)，最高599元5G-A(400G/2000M)。169+档支持同城宽带20元纳入满减。";
            } else {
                answer = "暑促重点推荐：★179元(140G/800分钟/2000M+FTTR+智屏)；新用户★149夺旗(120G/1000M)；入门89夺旗(60G/500M)。请告知预算和需求以便精准推荐。";
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("answer", answer);
            result.put("source", "电信套餐政策知识库（本地降级）");
            result.put("confidence", 0.85);
            result.put("suggestedAction", null);
            return result;
        }

        // 通用问答
        String answer;
        if (message.contains("领料")) {
            answer = "请进入智能填单，描述物料、数量和使用场景，确认后提交审批。";
        } else if (message.contains("接单") || message.contains("工单")) {
            answer = "在工作台选择"待接单"分类，打开任务详情后点击"接单"。接单成功后任务进入"已接单"状态。";
        } else if (message.contains("完工") || message.contains("反馈")) {
            answer = "完工反馈需要填写实际用料和完工备注，并上传现场图片及客户手写签名。";
        } else if (message.contains("商机")) {
            answer = "进入智能创建商机，描述客户意向（客户名、项目、预计金额、意向等级），AI 会自动生成结构化商机记录。";
        } else {
            answer = "你好！我是翼线助手。可以帮你处理领料申请、套餐推荐、任务处理和商机创建。请问有什么可以帮你？";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answer", answer);
        result.put("source", "本地降级知识");
        result.put("confidence", 0.7);
        result.put("suggestedAction", message.contains("领料")
                ? Map.of("label", "去提领料申请", "route", "/apply/material")
                : null);
        return result;
    }

    // --- 本地解析辅助方法 ---

    private String extractLocation(String text) {
        if (text == null || text.isEmpty()) return "";
        // 匹配 XX区/县 + 后续地址
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("[一-龥]{2,}[区县][一-龥\\d，、]*?(?:[路街弄道][一-龥\\d，、]*?\\d*号?)?")
                .matcher(text);
        if (m.find()) return m.group();

        // 匹配 XX路/街/道 XX号
        m = java.util.regex.Pattern
                .compile("[一-龥]{2,}[路街弄道][一-龥\\d，、]*?\\d+号")
                .matcher(text);
        if (m.find()) return m.group();

        // 匹配 XX街道/镇/村/社区/园区
        m = java.util.regex.Pattern
                .compile("[一-龥]{2,}(?:街道|镇|乡|村|社区|小区|园区|大厦)")
                .matcher(text);
        if (m.find()) return m.group();

        // 兜底：去XX / 在XX 后面的地名
        m = java.util.regex.Pattern
                .compile("(?:去|在|到|前往)\\s*([一-龥]{2,}(?:区|县|镇|村|路|街|道))")
                .matcher(text);
        if (m.find()) return m.group(1);

        return "";
    }

    private String extractTime(String text) {
        if (text == null || text.isEmpty()) return null;
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.Map<String, Integer> offsets = new java.util.LinkedHashMap<>();
        offsets.put("今天", 0); offsets.put("明天", 1); offsets.put("后天", 2); offsets.put("大后天", 3);
        offsets.put("周一", 1); offsets.put("周二", 2); offsets.put("周三", 3); offsets.put("周四", 4);
        offsets.put("周五", 5); offsets.put("周六", 6); offsets.put("周日", 7); offsets.put("星期天", 7);

        for (var entry : offsets.entrySet()) {
            if (text.contains(entry.getKey())) {
                int offset = entry.getValue();
                // 下周X
                if (text.contains("下" + entry.getKey())) offset += 7;
                java.time.LocalDate target = today.plusDays(offset);
                return target.toString() + " 09:00:00";
            }
        }

        // 匹配具体日期：X月X日
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*[日号]").matcher(text);
        if (m.find()) {
            int month = Integer.parseInt(m.group(1));
            int day = Integer.parseInt(m.group(2));
            return String.format("%d-%02d-%02d 09:00:00", today.getYear(), month, day);
        }

        return null;
    }

    private List<Map<String, Object>> extractMaterialsLocal(String text) {
        List<Map<String, Object>> materials = new ArrayList<>();
        if (text == null || text.isEmpty()) return materials;

        // 匹配：数字+单位+物料名
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("([一二两三四五六七八九十]\\d*|\\d+)\\s*(台|个|根|卷|箱|套|件|包|条)\\s*([\\u4e00-龥a-zA-Z0-9\\-+]+)")
                .matcher(text);
        java.util.Set<String> seen = new java.util.HashSet<>();
        while (m.find()) {
            String name = m.group(3).trim();
            if (seen.add(name)) {
                Map<String, Object> material = new LinkedHashMap<>();
                material.put("name", name);
                material.put("quantity", parseChineseNumber(m.group(1)));
                material.put("unit", m.group(2));
                materials.add(material);
            }
        }

        // 如果没有匹配到带单位的，尝试匹配已知物料名
        if (materials.isEmpty()) {
            String[] knownMaterials = {"光猫", "光纤", "企业网关", "网线", "路由器", "摄像头", "智屏", "中屏", "机顶盒", "FTTR", "交换机", "标签纸", "水晶头", "模块", "面板", "电源"};
            for (String known : knownMaterials) {
                if (text.contains(known) && seen.add(known)) {
                    Map<String, Object> material = new LinkedHashMap<>();
                    material.put("name", known);
                    material.put("quantity", 1);
                    material.put("unit", known.contains("纤") || known.contains("线") ? "根" : "台");
                    materials.add(material);
                }
            }
        }

        return materials;
    }

    private String extractCustomerNameLocal(String text) {
        if (text == null || text.isEmpty()) return "";
        // 公司名
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("([一-龥]{2,}(?:科技|网络|信息|通信|软件|数据|智能|电子|集团|控股|股份|有限){1,2}(?:公司|集团|有限公司|股份有限公司)?)")
                .matcher(text);
        if (m.find()) return m.group(1);

        // 产业园/园区/工厂/医院/学校
        m = java.util.regex.Pattern
                .compile("([一-龥]{2,}(?:产业园|科技园|工业园|创业园|园区|工厂|医院|学校|学院|大学|中心|局|处|所|站))")
                .matcher(text);
        if (m.find()) return m.group(1);

        // 人名：X先生/X女士/X总/X经理
        m = java.util.regex.Pattern
                .compile("([一-龥]{1,4}(?:先生|女士|总|经理|老板|工|师傅|小姐|老师))")
                .matcher(text);
        if (m.find()) return m.group(1);

        // "拜访/联系 XX"
        m = java.util.regex.Pattern
                .compile("(?:拜访|联系|去|找|见)\\s*([一-龥]{2,8})")
                .matcher(text);
        if (m.find()) return m.group(1);

        return "";
    }

    private String extractPurposeLocal(String text) {
        if (text == null || text.isEmpty()) return "";
        String[] keywords = {"谈", "沟通", "商讨", "讨论", "拜访", "签约", "维护", "勘察", "评估", "调研", "推广", "演示", "测试", "巡检", "升级", "扩容", "改造"};
        for (String kw : keywords) {
            if (text.contains(kw)) {
                int idx = text.indexOf(kw);
                int start = Math.max(0, idx - 2);
                int end = Math.min(text.length(), idx + kw.length() + 10);
                return text.substring(start, end).trim();
            }
        }
        return text.length() > 30 ? text.substring(0, 30).trim() : text.trim();
    }

    private String extractOpportunityTitleLocal(String text) {
        if (text == null || text.isEmpty()) return "";
        String[] keywords = {"升级", "扩容", "新建", "接入", "部署", "改造", "项目", "方案", "系统", "平台", "专线", "组网", "云"};
        for (String kw : keywords) {
            if (text.contains(kw)) {
                int idx = text.indexOf(kw);
                int start = Math.max(0, idx - 6);
                int end = Math.min(text.length(), idx + 12);
                return text.substring(start, end).trim();
            }
        }
        return text.length() > 40 ? text.substring(0, 40).trim() : text.trim();
    }

    private String extractIntentLevelLocal(String text) {
        if (text == null || text.isEmpty()) return "MEDIUM";
        if (text.contains("A类") || text.contains("高意向") || text.contains("强烈") || text.contains("很感兴趣")) return "HIGH";
        if (text.contains("C类") || text.contains("低意向") || text.contains("观望")) return "LOW";
        return "MEDIUM";
    }

    private Long extractAmountLocal(String text) {
        if (text == null || text.isEmpty()) return null;
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("[¥￥]?\\s*(\\d+(?:\\.\\d+)?)\\s*(万|元)?")
                .matcher(text);
        if (m.find()) {
            double value = Double.parseDouble(m.group(1));
            if ("万".equals(m.group(2))) value *= 10000;
            return Math.round(value * 100); // 转为分
        }
        return null;
    }

    private int parseChineseNumber(String s) {
        if (s == null || s.isEmpty()) return 1;
        try { return Integer.parseInt(s); } catch (NumberFormatException ignored) {}
        java.util.Map<Character, Integer> map = Map.of(
                '零', 0, '一', 1, '二', 2, '两', 2, '三', 3, '四', 4,
                '五', 5, '六', 6, '七', 7, '八', 8, '九', 9, '十', 10
        );
        if (s.length() == 1) return map.getOrDefault(s.charAt(0), 1);
        // "十一" → 11, "二十三" → 23
        int result = 0;
        if (s.charAt(0) == '十') result = 10;
        else if (map.containsKey(s.charAt(0))) result = map.get(s.charAt(0)) * 10;
        if (s.length() > 1 && s.charAt(s.length() - 1) != '十' && map.containsKey(s.charAt(s.length() - 1)))
            result += map.get(s.charAt(s.length() - 1));
        return result > 0 ? result : 1;
    }
}
