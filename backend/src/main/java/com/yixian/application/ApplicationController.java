package com.yixian.application;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yixian.common.PageResult;
import com.yixian.common.Result;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @GetMapping("/applications")
    public Result<PageResult<ApplicationEntity>> list(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        Page<ApplicationEntity> page = applicationService.list(pageNo, pageSize, type, status);
        return Result.ok(PageResult.of(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/applications/{id}")
    public Result<ApplicationEntity> get(@PathVariable Long id) {
        return Result.ok(applicationService.get(id));
    }

    @PostMapping("/applications")
    public Result<ApplicationEntity> create(@Valid @RequestBody ApplicationService.CreateRequest request) {
        return Result.ok(applicationService.create(request));
    }

    @PostMapping("/applications/{id}/cancel")
    public Result<ApplicationEntity> cancel(
            @PathVariable Long id,
            @RequestBody ApplicationService.WriteRequest request
    ) {
        return Result.ok(applicationService.cancel(id, request));
    }

    @GetMapping("/approvals/{id}/records")
    public Result<List<ApprovalRecord>> records(@PathVariable Long id) {
        return Result.ok(applicationService.records(id));
    }
}
