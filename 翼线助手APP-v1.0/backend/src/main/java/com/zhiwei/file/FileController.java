package com.zhiwei.file;

import com.zhiwei.common.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @PostMapping("/upload")
    public ApiResponse<FileService.FileResult> upload(
            @RequestParam MultipartFile file,
            @RequestParam(required = false) String bizType,
            @RequestParam(required = false) Long bizId,
            @RequestParam String idempotencyKey
    ) {
        return ApiResponse.success(fileService.upload(file, bizType, bizId, idempotencyKey));
    }
}
