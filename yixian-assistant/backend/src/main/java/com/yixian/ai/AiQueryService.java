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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiQueryService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    @Value("${deepseek.api-key:}")
    private String apiKey;

    @Value("${deepseek.base-url:https://api.deepseek.com}")
    private String baseUrl;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

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

        INTENT_SQL.put("VISIT_STATS",
                "SELECT u.real_name visitor, COUNT(v.id) visit_count " +
                        "FROM visit_record v LEFT JOIN sys_user u ON v.visitor_id=u.id " +
                        "WHERE v.visit_time >= ? " +
                        "GROUP BY v.visitor_id, u.real_name ORDER BY visit_count DESC LIMIT 10");

        INTENT_SQL.put("OPPORTUNITY_SUMMARY",
                "SELECT c.name customer, o.title, o.status, o.intent_level, " +
                        "ROUND(o.estimated_amount / 10000.0, 2) amount_wan, u.real_name manager " +
                        "FROM opportunity o " +
                        "LEFT JOIN customer c ON o.customer_id=c.id " +
                        "LEFT JOIN sys_user u ON o.manager_id=u.id " +
                        "WHERE o.is_deleted=0 AND o.create_time >= ? " +
                        "ORDER BY o.intent_level='HIGH' DESC, o.estimated_amount DESC LIMIT 20");

        INTENT_SQL.put("APPLICATION_TREND",
                "SELECT DATE(create_time) day, type, status, COUNT(*) count " +
                        "FROM application WHERE is_deleted=0 AND create_time >= ? " +
                        "GROUP BY day, type, status ORDER BY day DESC");
    }

    private static final Map<String, String> INTENT_LABEL = Map.of(
            "TASK_STATS", "任务统计",
            "PEOPLE_RANK", "人员完成排行",
            "OVERDUE_ANALYSIS", "超时任务分析",
            "VISIT_STATS", "拜访统计",
            "OPPORTUNITY_SUMMARY", "商机汇总",
            "APPLICATION_TREND", "申请趋势"
    );

    private static final Map<String, String> COLUMN_LABEL = Map.ofEntries(
            Map.entry("total", "总数"),
            Map.entry("completed", "已完成"),
            Map.entry("overdue", "超时数"),
            Map.entry("real_name", "人员"),
            Map.entry("employee_no", "工号"),
            Map.entry("finished_count", "完成数"),
            Map.entry("task_no", "工单号"),
            Map.entry("title", "标题"),
            Map.entry("type", "类型"),
            Map.entry("assignee", "处理人"),
            Map.entry("expected_finish_time", "期望完成时间"),
            Map.entry("overdue_hours", "超时小时"),
            Map.entry("visitor", "拜访人"),
            Map.entry("visit_count", "拜访次数"),
            Map.entry("customer", "客户"),
            Map.entry("status", "状态"),
            Map.entry("intent_level", "意向等级"),
            Map.entry("amount_wan", "预计金额(万)"),
            Map.entry("manager", "客户经理"),
            Map.entry("day", "日期"),
            Map.entry("count", "数量")
    );

    public AiQueryResponse query(String question) {
        QueryOutcome outcome = execute(question);
        if (outcome.intent() == null) {
            return AiQueryResponse.text("暂不支持该查询类型，可以问我：任务统计、人员排行、超时分析、拜访次数、商机汇总、申请趋势。");
        }
        return AiQueryResponse.table(INTENT_LABEL.get(outcome.intent()), outcome.rows(), outcome.startDate());
    }

    public Map<String, Object> querySmartBrain(String question, String sessionId, Map<String, Object> context) {
        QueryOutcome outcome = execute(question);
        if (outcome.intent() == null) {
            return smartText(
                    "这个问题暂未命中受控查询模板。你可以询问完成率、超时排行、拜访次数、商机转化、高意向客户或申请趋势。",
                    "未执行数据查询",
                    0.45
            );
        }

        Map<String, Object> result = new LinkedHashMap<>();
        String metric = metricFor(outcome.intent(), outcome.rows());
        result.put("text", textFor(outcome.intent(), outcome.rows(), metric));
        if (metric != null) {
            result.put("metric", metric);
        }
        result.put("columns", columnsFor(outcome.rows()));
        result.put("rows", outcome.rows());
        result.put("source", INTENT_LABEL.get(outcome.intent()) + "，时间范围：" + outcome.startDate() + " 至今");
        result.put("confidence", hasApiKey() ? 0.86 : 0.72);
        result.put("resultRows", outcome.rows().size());
        return result;
    }

    private QueryOutcome execute(String rawQuestion) {
        String question = rawQuestion == null ? "" : rawQuestion.trim();
        String intent = recognizeIntent(question);
        if (intent == null) {
            return new QueryOutcome(null, List.of(), LocalDate.now().minusDays(30).toString());
        }

        String startDate = LocalDate.now().minusDays(30).toString();
        try {
            String sql = INTENT_SQL.get(intent);
            List<Map<String, Object>> rows = sql.contains("?")
                    ? jdbc.queryForList(sql, startDate)
                    : jdbc.queryForList(sql);
            return new QueryOutcome(intent, normalizeRows(rows), startDate);
        } catch (Exception exception) {
            log.error("AI query SQL error intent={}", intent, exception);
            return new QueryOutcome(null, List.of(), startDate);
        }
    }

    private String recognizeIntent(String question) {
        String localIntent = recognizeIntentLocal(question);
        if (!hasApiKey()) {
            return localIntent;
        }
        try {
            String prompt = """
                    你是一个意图分类器，只能返回以下意图之一，纯文本，不要解释：
                    TASK_STATS, PEOPLE_RANK, OVERDUE_ANALYSIS, VISIT_STATS, OPPORTUNITY_SUMMARY, APPLICATION_TREND, UNKNOWN

                    用户问题：%s
                    """.formatted(question);

            String body = mapper.writeValueAsString(Map.of(
                    "model", model,
                    "messages", List.of(Map.of("role", "user", "content", prompt)),
                    "max_tokens", 20,
                    "temperature", 0
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(chatCompletionsUrl()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode node = mapper.readTree(response.body());
            String intent = node.path("choices").path(0).path("message").path("content").asText("")
                    .trim()
                    .toUpperCase(Locale.ROOT);

            return INTENT_SQL.containsKey(intent) ? intent : localIntent;
        } catch (Exception exception) {
            log.warn("DeepSeek intent recognition failed, fallback to local: {}", exception.getMessage());
            return localIntent;
        }
    }

    private String recognizeIntentLocal(String question) {
        String q = question == null ? "" : question;
        if (q.contains("超期") || q.contains("逾期") || q.contains("超时")) return "OVERDUE_ANALYSIS";
        if (q.contains("排行") || q.contains("排名") || q.contains("谁完成")) return "PEOPLE_RANK";
        if (q.contains("拜访") || q.contains("走访")) return "VISIT_STATS";
        if (q.contains("商机") || q.contains("客户") || q.contains("销售") || q.contains("高意向") || q.contains("转化")) {
            return "OPPORTUNITY_SUMMARY";
        }
        if (q.contains("申请") && (q.contains("趋势") || q.contains("数量") || q.contains("统计"))) return "APPLICATION_TREND";
        if (q.contains("任务") || q.contains("工单") || q.contains("完成率") || q.contains("多少")) return "TASK_STATS";
        return null;
    }

    private boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("your_") && !apiKey.contains("你的");
    }

    private String chatCompletionsUrl() {
        String root = (baseUrl == null || baseUrl.isBlank() ? "https://api.deepseek.com" : baseUrl).replaceAll("/+$", "");
        return root + "/chat/completions";
    }

    private List<Map<String, Object>> normalizeRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> normalized = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            row.forEach((key, value) -> item.put(key == null ? "" : key.toLowerCase(Locale.ROOT), value));
            normalized.add(item);
        }
        return normalized;
    }

    private List<Map<String, String>> columnsFor(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return List.of();
        List<Map<String, String>> columns = new ArrayList<>();
        for (String key : rows.get(0).keySet()) {
            columns.add(Map.of("key", key, "label", COLUMN_LABEL.getOrDefault(key, key)));
        }
        return columns;
    }

    private String metricFor(String intent, List<Map<String, Object>> rows) {
        if ("TASK_STATS".equals(intent) && !rows.isEmpty()) {
            Map<String, Object> row = rows.get(0);
            long total = number(row.get("total"));
            long completed = number(row.get("completed"));
            if (total == 0) return "0%";
            return Math.round(completed * 100.0 / total) + "%";
        }
        if ("VISIT_STATS".equals(intent)) {
            long total = rows.stream().mapToLong(row -> number(row.get("visit_count"))).sum();
            return total + " 次";
        }
        if ("OPPORTUNITY_SUMMARY".equals(intent)) {
            long highIntent = rows.stream()
                    .filter(row -> "HIGH".equalsIgnoreCase(String.valueOf(row.get("intent_level"))))
                    .count();
            return highIntent + " 个高意向";
        }
        return null;
    }

    private String textFor(String intent, List<Map<String, Object>> rows, String metric) {
        return switch (intent) {
            case "TASK_STATS" -> "近 30 天工单完成率如下：";
            case "PEOPLE_RANK" -> "近 30 天装维人员完成排行如下：";
            case "OVERDUE_ANALYSIS" -> "当前超时未完成工单如下：";
            case "VISIT_STATS" -> "近 30 天客户拜访次数如下：";
            case "OPPORTUNITY_SUMMARY" -> "近 30 天商机与高意向客户如下：";
            case "APPLICATION_TREND" -> "近 30 天申请趋势如下：";
            default -> rows.isEmpty() ? "未查询到匹配数据。" : "查询结果如下：";
        };
    }

    private long number(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return 0L;
        }
    }

    private Map<String, Object> smartText(String text, String source, double confidence) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("text", text);
        result.put("source", source);
        result.put("confidence", confidence);
        result.put("columns", List.of());
        result.put("rows", List.of());
        result.put("resultRows", 0);
        return result;
    }

    private record QueryOutcome(String intent, List<Map<String, Object>> rows, String startDate) {
    }

    @Data
    public static class AiQueryResponse {
        private String type;
        private String title;
        private String text;
        private List<Map<String, Object>> rows;
        private String timeRange;

        static AiQueryResponse text(String message) {
            AiQueryResponse response = new AiQueryResponse();
            response.type = "TEXT";
            response.text = message;
            response.rows = List.of();
            return response;
        }

        static AiQueryResponse table(String title, List<Map<String, Object>> rows, String since) {
            AiQueryResponse response = new AiQueryResponse();
            response.type = "TABLE";
            response.title = title;
            response.rows = rows;
            response.timeRange = since + " 至今";
            return response;
        }
    }
}
