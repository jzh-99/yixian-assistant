package com.zhiwei.ai;

import com.zhiwei.auth.AuthContext;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiService {
    private final AiGateway gateway;
    private final AiQueryLogMapper logMapper;

    public Map<String, Object> extract(ExtractRequest request) {
        return logged(request.input(), () -> gateway.extract(request.input(), request.applicationType()));
    }

    public Map<String, Object> chat(ChatRequest request) {
        return logged(request.message(), () -> gateway.chat(request.message(), request.history()));
    }

    public Map<String, Object> query(QueryRequest request) {
        return logged(request.question(), () -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("intentId", null);
            result.put("result", null);
            result.put("suggestion", "管理智脑查询接口已预留，请接入白名单意图解析与统计服务。");
            return result;
        });
    }

    public Map<String, Object> dispatchReason(DispatchReasonRequest request) {
        return Map.of(
                "reason", "派单推理接口已预留，接入人员技能、负载和完成率后生成正式推荐理由。"
        );
    }

    private Map<String, Object> logged(String question, Action action) {
        Instant start = Instant.now();
        boolean success = false;
        try {
            Map<String, Object> result = action.run();
            success = true;
            return result;
        } finally {
            AiQueryLog log = new AiQueryLog();
            log.setUserId(AuthContext.required().userId());
            log.setQuestion(question);
            log.setElapsedMs((int) Duration.between(start, Instant.now()).toMillis());
            log.setResultRows(0);
            log.setSuccess(success ? 1 : 0);
            log.setCreateTime(LocalDateTime.now());
            logMapper.insert(log);
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

    public record QueryRequest(String question, String sessionId) {
    }

    public record DispatchReasonRequest(Long taskId, String taskDesc, Map<String, Object> selected) {
    }
}
