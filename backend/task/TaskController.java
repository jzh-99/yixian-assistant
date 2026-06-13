package com.zhiwei.task;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhiwei.application.ApplicationController.PageResult;
import com.zhiwei.common.api.ApiResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    @GetMapping
    public ApiResponse<PageResult<TaskEntity>> list(
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String status
    ) {
        Page<TaskEntity> page = taskService.list(pageNo, pageSize, status);
        return ApiResponse.success(new PageResult<>(page.getRecords(), page.getTotal(), pageNo, pageSize));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskEntity> get(@PathVariable Long id) {
        return ApiResponse.success(taskService.get(id));
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<TaskEntity> accept(
            @PathVariable Long id,
            @RequestBody TaskService.ActionRequest request
    ) {
        return ApiResponse.success(taskService.accept(id, request));
    }

    @PostMapping("/{id}/start")
    public ApiResponse<TaskEntity> start(
            @PathVariable Long id,
            @RequestBody TaskService.ActionRequest request
    ) {
        return ApiResponse.success(taskService.start(id, request));
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<TaskEntity> complete(
            @PathVariable Long id,
            @RequestBody TaskService.CompleteRequest request
    ) {
        return ApiResponse.success(taskService.complete(id, request));
    }
}
