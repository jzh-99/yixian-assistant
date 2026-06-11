package com.yixian.ai;

import com.yixian.common.Result;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {
    private final AiService aiService;
    private final AiQueryService aiQueryService;

    // AI① 智能填单 — 从用户输入中提取字段
    @PostMapping("/extract")
    public Result<Map<String, Object>> extract(@RequestBody AiService.ExtractRequest request) {
        return Result.ok(aiService.extract(request));
    }

    // AI② 智能问答
    @PostMapping("/chat")
    public Result<Map<String, Object>> chat(@RequestBody AiService.ChatRequest request) {
        return Result.ok(aiService.chat(request));
    }

    // AI④ 管理智脑 — 自然语言查询统计
    @PostMapping("/query")
    public Result<AiQueryService.AiQueryResponse> query(@RequestBody AiQueryRequest req) {
        return Result.ok(aiQueryService.query(req.getQuestion()));
    }

    // AI③ 智能派单 — 生成派单推荐理由
    @PostMapping("/dispatch-reason")
    public Result<Map<String, Object>> dispatchReason(
            @RequestBody AiService.DispatchReasonRequest request
    ) {
        return Result.ok(aiService.dispatchReason(request));
    }
}
