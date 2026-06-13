package com.yixian.ai;

import com.yixian.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/extract")
    public Result<Map<String, Object>> extract(@RequestBody AiService.ExtractRequest request) {
        return Result.ok(aiService.extract(request));
    }

    @PostMapping("/chat")
    public Result<Map<String, Object>> chat(@RequestBody AiService.ChatRequest request) {
        return Result.ok(aiService.chat(request));
    }

    @PostMapping("/query")
    public Result<Map<String, Object>> query(@RequestBody AiService.QueryRequest request) {
        return Result.ok(aiService.query(request));
    }

    @PostMapping("/dispatch-reason")
    public Result<Map<String, Object>> dispatchReason(@RequestBody AiService.DispatchReasonRequest request) {
        return Result.ok(aiService.dispatchReason(request));
    }
}
