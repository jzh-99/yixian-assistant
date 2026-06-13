package com.zhiwei.task;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhiwei.auth.AuthContext;
import com.zhiwei.auth.CurrentUser;
import com.zhiwei.common.exception.BusinessException;
import com.zhiwei.common.idempotency.IdempotencyService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskMapper taskMapper;
    private final TaskFeedbackMapper feedbackMapper;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public Page<TaskEntity> list(int pageNo, int pageSize, String status) {
        CurrentUser user = AuthContext.required();
        return taskMapper.selectPage(
                Page.of(pageNo, Math.min(pageSize, 100)),
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<TaskEntity>lambdaQuery()
                        .eq("MAINTAINER".equals(user.roleCode()), TaskEntity::getAssigneeId, user.userId())
                        .eq(status != null && !status.isBlank(), TaskEntity::getStatus, status)
                        .orderByDesc(TaskEntity::getCreateTime)
        );
    }

    public TaskEntity get(Long id) {
        TaskEntity task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(404, "任务不存在");
        }
        CurrentUser user = AuthContext.required();
        if ("MAINTAINER".equals(user.roleCode()) && !user.userId().equals(task.getAssigneeId())) {
            throw new BusinessException(403, "无权查看该任务");
        }
        return task;
    }

    @Transactional
    public TaskEntity accept(Long id, ActionRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () ->
                updateStatus(id, request.version(), "PENDING_ACCEPTANCE", "ACCEPTED", false));
    }

    @Transactional
    public TaskEntity start(Long id, ActionRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () ->
                updateStatus(id, request.version(), "ACCEPTED", "IN_PROGRESS", false));
    }

    @Transactional
    public TaskEntity complete(Long id, CompleteRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            TaskEntity task = updateStatus(id, request.version(), "IN_PROGRESS", "COMPLETED", true);
            TaskFeedback feedback = new TaskFeedback();
            feedback.setTaskId(id);
            feedback.setOperatorId(AuthContext.required().userId());
            feedback.setActualMaterials(writeJson(request.actualMaterials()));
            feedback.setResultDesc(request.resultDesc());
            feedback.setImageUrlsJson(writeJson(request.imageUrls()));
            feedback.setSignatureUrl(request.signatureUrl());
            feedback.setCreateTime(LocalDateTime.now());
            feedbackMapper.insert(feedback);
            return task;
        });
    }

    private TaskEntity updateStatus(
            Long id,
            Integer version,
            String expectedStatus,
            String nextStatus,
            boolean finished
    ) {
        if (version == null) {
            throw new BusinessException(1001, "version 不能为空");
        }
        TaskEntity task = get(id);
        int changed = taskMapper.update(
                null,
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<TaskEntity>lambdaUpdate()
                        .eq(TaskEntity::getId, id)
                        .eq(TaskEntity::getVersion, version)
                        .eq(TaskEntity::getStatus, expectedStatus)
                        .set(TaskEntity::getStatus, nextStatus)
                        .set(TaskEntity::getVersion, version + 1)
                        .set(TaskEntity::getUpdateTime, LocalDateTime.now())
                        .set(finished, TaskEntity::getActualFinishTime, LocalDateTime.now())
        );
        if (changed == 0) {
            throw new BusinessException(409, "任务已被其他人更新，请刷新后重试");
        }
        return taskMapper.selectById(task.getId());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (JsonProcessingException exception) {
            throw new BusinessException(1001, "反馈数据格式错误");
        }
    }

    public record ActionRequest(Integer version, String idempotencyKey) {
    }

    public record CompleteRequest(
            Integer version,
            List<Map<String, Object>> actualMaterials,
            String resultDesc,
            List<String> imageUrls,
            String signatureUrl,
            String idempotencyKey
    ) {
    }
}
