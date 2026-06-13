package com.zhiwei.application;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhiwei.common.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
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

@Validated
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @GetMapping("/applications")
    public ApiResponse<PageResult<ApplicationEntity>> list(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        Page<ApplicationEntity> page = applicationService.listMine(pageNo, pageSize, type, status);
        return ApiResponse.success(new PageResult<>(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/applications/my")
    public ApiResponse<PageResult<ApplicationEntity>> myApplications(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        Page<ApplicationEntity> page = applicationService.listMine(pageNo, pageSize, type, status);
        return ApiResponse.success(new PageResult<>(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/applications/{id}")
    public ApiResponse<ApplicationEntity> get(@PathVariable Long id) {
        return ApiResponse.success(applicationService.getMine(id));
    }

    @PostMapping("/applications")
    public ApiResponse<ApplicationEntity> create(@Valid @RequestBody ApplicationService.CreateRequest request) {
        return ApiResponse.success(applicationService.create(request));
    }

    @PostMapping("/applications/{id}/cancel")
    public ApiResponse<ApplicationEntity> cancel(
            @PathVariable Long id,
            @RequestBody ApplicationService.WriteRequest request
    ) {
        return ApiResponse.success(applicationService.cancel(id, request));
    }

    @GetMapping("/approvals/{id}/records")
    public ApiResponse<List<ApprovalRecord>> records(@PathVariable Long id) {
        return ApiResponse.success(applicationService.records(id));
    }

    @GetMapping("/admin/applications")
    public ApiResponse<PageResult<ApplicationEntity>> adminList(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        Page<ApplicationEntity> page = applicationService.listForApproval(pageNo, pageSize, type, status);
        return ApiResponse.success(new PageResult<>(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/admin/applications/{id}")
    public ApiResponse<ApplicationEntity> adminGet(@PathVariable Long id) {
        return ApiResponse.success(applicationService.getForApproval(id));
    }

    @PatchMapping("/admin/applications/{id}/approve")
    public ApiResponse<ApplicationEntity> approve(
            @PathVariable Long id,
            @RequestBody ApplicationService.ApproveRequest request
    ) {
        return ApiResponse.success(applicationService.approve(id, request));
    }

    @PatchMapping("/admin/applications/{id}/reject")
    public ApiResponse<ApplicationEntity> reject(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationService.RejectRequest request
    ) {
        return ApiResponse.success(applicationService.reject(id, request));
    }

    public record PageResult<T>(List<T> list, long total, int pageNo, int pageSize) {
    }
}
