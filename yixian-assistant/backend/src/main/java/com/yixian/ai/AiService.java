package com.yixian.ai;

import com.yixian.auth.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiGateway gateway;
    private final AiQueryService aiQueryService;
    private final AiQueryLogMapper logMapper;

    public Map<String, Object> extract(ExtractRequest request) {
        String input = request == null ? "" : request.input();
        String applicationType = request == null ? "" : request.applicationType();
        return logged(input, () -> gateway.extract(input, applicationType));
    }

    public Map<String, Object> chat(ChatRequest request) {
        String message = request == null ? "" : request.message();
        List<Map<String, String>> history = request == null ? List.of() : request.history();
        return logged(message, () -> gateway.chat(message, history));
    }

    public Map<String, Object> query(QueryRequest request) {
        String question = request == null ? "" : request.question();
        String sessionId = request == null ? "" : request.sessionId();
        Map<String, Object> context = request == null ? Map.of() : request.context();
        return logged(question, () -> {
            try {
                return aiQueryService.querySmartBrain(question, sessionId, context);
            } catch (Exception exception) {
                log.warn("Controlled AI query failed, fallback to gateway: {}", exception.getMessage());
                return gateway.query(question, sessionId, context);
            }
        });
    }

    public Map<String, Object> dispatchReason(DispatchReasonRequest request) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reason", "已根据任务类型、人员技能、当前负载和组织范围生成推荐理由。");
        result.put("taskId", request == null ? null : request.taskId());
        return result;
    }

    private Map<String, Object> logged(String question, Action action) {
        Instant start = Instant.now();
        boolean success = false;
        try {
            Map<String, Object> result = action.run();
            success = true;
            return result;
        } finally {
            saveLog(question, success, start);
        }
    }

    private void saveLog(String question, boolean success, Instant start) {
        try {
            UserContext.CurrentUser user = UserContext.get();
            AiQueryLog logRow = new AiQueryLog();
            logRow.setUserId(user.getUserId());
            logRow.setQuestion(question);
            logRow.setElapsedMs((int) Duration.between(start, Instant.now()).toMillis());
            logRow.setResultRows(0);
            logRow.setSuccess(success ? 1 : 0);
            logRow.setCreateTime(LocalDateTime.now());
            logMapper.insert(logRow);
        } catch (Exception exception) {
            // AI answers should still work if audit logging is temporarily unavailable.
            log.warn("AI query log write failed: {}", exception.getMessage());
        }
    }

    @FunctionalInterface
    private interface Action {
        Map<String, Object> run();
    }

    public record ExtractRequest(String input, String applicationType) {
    }

    public record ChatRequest(String message, String sessionId, List<Map<String, String>> history) {
    }

    public record QueryRequest(String question, String sessionId, Map<String, Object> context) {
    }

    public record DispatchReasonRequest(Long taskId, String taskDesc, Map<String, Object> selected) {
    }
}
