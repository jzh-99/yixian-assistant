package com.yixian.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiQueryService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${deepseek.api-key:}")
    private String apiKey;

    @Value("${deepseek.base-url:https://api.deepseek.com}")
    private String baseUrl;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

    // 白名单意图 → SQL 模板
    private static final Map<String, String> INTENT_SQL = new LinkedHashMap<>();
    static {
        INTENT_SQL.put("TASK_STATS",
            "SELECT COUNT(*) total, " +
            "SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) completed, " +
            "SUM(CASE WHEN expected_finish_time < NOW() AND status NOT IN ('COMPLETED','CANCELLED') THEN 1 ELSE 0 END) overdue " +
            "FROM task WHERE is_deleted=0 AND create_time >= ?");

        INTENT_SQL.put("PEOPLE_RANK",
            "SELECT u.real_name, u.employee_no, COUNT(t.id) finished_count " +
            "FROM sys_user u LEFT JOIN task t ON t.assignee_id=u.id " +
            "AND t.status='COMPLETED' AND t.actual_finish_time >= ? " +
            "WHERE u.role_code='MAINTAINER' AND u.is_deleted=0 " +
            "GROUP BY u.id ORDER BY finished_count DESC LIMIT 10");

        INTENT_SQL.put("OVERDUE_ANALYSIS",
            "SELECT t.task_no, t.title, t.type, u.real_name assignee, " +
            "t.expected_finish_time, " +
            "TIMESTAMPDIFF(HOUR, t.expected_finish_time, NOW()) overdue_hours " +
            "FROM task t LEFT JOIN sys_user u ON t.assignee_id=u.id " +
            "WHERE t.expected_finish_time < NOW() " +
            "AND t.status NOT IN ('COMPLETED','CANCELLED') AND t.is_deleted=0 " +
            "ORDER BY overdue_hours DESC LIMIT 20");

        INTENT_SQL.put("OPPORTUNITY_SUMMARY",
            "SELECT status, COUNT(*) count, SUM(estimated_amount)/100.0 total_amount_yuan " +
            "FROM opportunity WHERE is_deleted=0 AND create_time >= ? " +
            "GROUP BY status");

        INTENT_SQL.put("APPLICATION_TREND",
            "SELECT DATE(create_time) day, type, COUNT(*) count " +
            "FROM application WHERE is_deleted=0 AND create_time >= ? " +
            "GROUP BY day, type ORDER BY day DESC");
    }

    private static final Map<String, String> INTENT_LABEL = Map.of(
        "TASK_STATS",         "任务统计",
        "PEOPLE_RANK",        "人员完成排行",
        "OVERDUE_ANALYSIS",   "超期任务分析",
        "OPPORTUNITY_SUMMARY","商机汇总",
        "APPLICATION_TREND",  "申请趋势"
    );

    public AiQueryResponse query(String question) {
        String intent = recognizeIntent(question);
        if (intent == null) {
            return AiQueryResponse.text("暂不支持该查询类型，可以问我：任务统计、人员排行、超期分析、商机汇总、申请趋势。");
        }

        String startDate = LocalDate.now().minusDays(30).toString();
        List<Map<String, Object>> rows;
        try {
            String sql = INTENT_SQL.get(intent);
            // 有时间参数的意图需要注入 startDate
            if (sql.contains("?")) {
                rows = jdbc.queryForList(sql, startDate);
            } else {
                rows = jdbc.queryForList(sql);
            }
        } catch (Exception e) {
            log.error("AI query SQL error intent={}", intent, e);
            return AiQueryResponse.text("查询执行失败，请稍后重试。");
        }

        return AiQueryResponse.table(INTENT_LABEL.get(intent), rows, startDate);
    }

    private String recognizeIntent(String question) {
        if (apiKey == null || apiKey.isBlank()) {
            return recognizeIntentLocal(question);
        }
        try {
            String prompt = """
                你是一个意图分类器，只能返回以下意图之一（纯文本，无引号）：
                TASK_STATS, PEOPLE_RANK, OVERDUE_ANALYSIS, OPPORTUNITY_SUMMARY, APPLICATION_TREND

                用户问题：%s

                无法匹配时返回：UNKNOWN
                """.formatted(question);

            String body = mapper.writeValueAsString(Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", 20,
                "temperature", 0
            ));

            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> resp = HttpClient.newHttpClient()
                .send(req, HttpResponse.BodyHandlers.ofString());

            JsonNode node = mapper.readTree(resp.body());
            String intent = node.path("choices").get(0)
                .path("message").path("content").asText().trim().toUpperCase();

            return INTENT_SQL.containsKey(intent) ? intent : recognizeIntentLocal(question);
        } catch (Exception e) {
            log.warn("DeepSeek intent recognition failed, fallback to local", e);
            return recognizeIntentLocal(question);
        }
    }

    // 本地关键词降级识别
    private String recognizeIntentLocal(String q) {
        if (q.contains("超期") || q.contains("逾期") || q.contains("超时")) return "OVERDUE_ANALYSIS";
        if (q.contains("排行") || q.contains("排名") || q.contains("谁完成")) return "PEOPLE_RANK";
        if (q.contains("任务") && (q.contains("统计") || q.contains("多少") || q.contains("完成"))) return "TASK_STATS";
        if (q.contains("商机") || q.contains("客户") || q.contains("销售")) return "OPPORTUNITY_SUMMARY";
        if (q.contains("申请") && (q.contains("趋势") || q.contains("数量") || q.contains("统计"))) return "APPLICATION_TREND";
        if (q.contains("任务")) return "TASK_STATS";
        return null;
    }

    @Data
    public static class AiQueryResponse {
        private String type;       // TEXT / TABLE
        private String title;
        private String text;
        private List<Map<String, Object>> rows;
        private String timeRange;

        static AiQueryResponse text(String msg) {
            AiQueryResponse r = new AiQueryResponse();
            r.type = "TEXT"; r.text = msg;
            return r;
        }

        static AiQueryResponse table(String title, List<Map<String, Object>> rows, String since) {
            AiQueryResponse r = new AiQueryResponse();
            r.type = "TABLE"; r.title = title; r.rows = rows;
            r.timeRange = since + " 至今";
            return r;
        }
    }
}
