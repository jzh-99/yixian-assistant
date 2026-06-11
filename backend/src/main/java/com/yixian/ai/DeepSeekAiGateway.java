package com.yixian.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yixian.common.BizException;
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

    @Value("${deepseek.base-url}")
    private String baseUrl;

    @Value("${deepseek.api-key}")
    private String apiKey;

    @Value("${deepseek.model}")
    private String model;

    @Override
    public Map<String, Object> extract(String input, String applicationType) {
        if (apiKey == null || apiKey.isBlank()) {
            return localExtract(input, applicationType);
        }
        String prompt = """
                按翼线助手接口契约从用户文本抽取申请字段。只返回 JSON：
                {"fields":{},"missingFields":[],"warnings":[],"confidence":0.0}
                applicationType=%s
                input=%s
                时间格式必须为 yyyy-MM-dd HH:mm:ss。
                """.formatted(applicationType, input);
        String content = complete(List.of(Map.of("role", "user", "content", prompt)), true);
        try {
            return objectMapper.readValue(content, new TypeReference<>() {});
        } catch (Exception exception) {
            throw new BizException(2001, "AI 字段抽取结果不可解析，已切换手工填写");
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
                "content", "你是翼线助手。只回答企业一线装维、拜访、领料、商机和支撑流程问题；不确定时明确建议联系主管。"
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
            throw new BizException(2001, "AI 服务不可用，已降级");
        }
    }

    private Map<String, Object> localExtract(String input, String type) {
        Map<String, Object> fields = new LinkedHashMap<>();
        if ("MATERIAL".equals(type)) {
            fields.put("title", input.contains("维修") || input.contains("修") ? "现场维修领料" : "现场装维领料");
            fields.put("content", input);
            fields.put("expectedTime", null);
            fields.put("location", input.contains("鼓楼") ? "南京市鼓楼区" : "");
            fields.put("materials", List.of());
        } else {
            fields.put("title", "客户拜访");
            fields.put("purpose", input);
            fields.put("expectedTime", null);
            fields.put("customerName", "");
            fields.put("needSupport", input.contains("支撑"));
        }
        return Map.of(
                "fields", fields,
                "missingFields", List.of("expectedTime"),
                "warnings", List.of(Map.of("field", "expectedTime", "message", "请补充准确时间")),
                "confidence", 0.58
        );
    }

    private Map<String, Object> localChat(String message) {
        String answer = message.contains("领料")
                ? "请进入智能填单，描述物料、数量和使用场景，确认后提交审批。"
                : "当前使用本地降级知识，请联系业务主管确认具体制度。";
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answer", answer);
        result.put("source", "本地降级知识");
        result.put("confidence", message.contains("领料") ? 0.8 : 0.4);
        result.put("suggestedAction", message.contains("领料")
                ? Map.of("label", "去提领料申请", "route", "/apply/material")
                : null);
        return result;
    }
}
