package com.yixian.application;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yixian.common.PageResult;
import com.yixian.common.Result;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
        Page<ApplicationEntity> page = applicationService.listMine(pageNo, pageSize, type, status);
        return Result.ok(PageResult.of(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/applications/my")
    public Result<PageResult<ApplicationEntity>> myApplications(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        Page<ApplicationEntity> page = applicationService.listMine(pageNo, pageSize, type, status);
        return Result.ok(PageResult.of(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/applications/{id}")
    public Result<ApplicationEntity> get(@PathVariable Long id) {
        return Result.ok(applicationService.getMine(id));
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

    @GetMapping("/admin/applications")
    public Result<PageResult<ApplicationEntity>> adminList(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        Page<ApplicationEntity> page = applicationService.listForApproval(pageNo, pageSize, type, status);
        return Result.ok(PageResult.of(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/admin/applications/{id}")
    public Result<ApplicationEntity> adminGet(@PathVariable Long id) {
        return Result.ok(applicationService.getForApproval(id));
    }

    @PatchMapping("/admin/applications/{id}/approve")
    public Result<ApplicationEntity> approve(
            @PathVariable Long id,
            @RequestBody ApplicationService.ApproveRequest request
    ) {
        return Result.ok(applicationService.approve(id, request));
    }

    @PatchMapping("/admin/applications/{id}/reject")
    public Result<ApplicationEntity> reject(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationService.RejectRequest request
    ) {
        return Result.ok(applicationService.reject(id, request));
    }
}
