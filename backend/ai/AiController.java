package com.zhiwei.ai;

import com.zhiwei.common.api.ApiResponse;
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

    @PostMapping("/extract")
    public ApiResponse<Map<String, Object>> extract(@RequestBody AiService.ExtractRequest request) {
        return ApiResponse.success(aiService.extract(request));
    }

    @PostMapping("/chat")
    public ApiResponse<Map<String, Object>> chat(@RequestBody AiService.ChatRequest request) {
        return ApiResponse.success(aiService.chat(request));
    }

    @PostMapping("/query")
    public ApiResponse<Map<String, Object>> query(@RequestBody AiService.QueryRequest request) {
        return ApiResponse.success(aiService.query(request));
    }

    @PostMapping("/dispatch-reason")
    public ApiResponse<Map<String, Object>> dispatchReason(
            @RequestBody AiService.DispatchReasonRequest request
    ) {
        return ApiResponse.success(aiService.dispatchReason(request));
    }
}
