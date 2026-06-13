package com.zhiwei.application;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhiwei.auth.AuthContext;
import com.zhiwei.auth.CurrentUser;
import com.zhiwei.auth.SysUser;
import com.zhiwei.auth.SysUserMapper;
import com.zhiwei.common.exception.BusinessException;
import com.zhiwei.common.idempotency.IdempotencyService;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private static final Set<String> TYPES = Set.of("MATERIAL", "VISIT", "SUPPORT");
    private final ApplicationMapper applicationMapper;
    private final ApprovalRecordMapper approvalRecordMapper;
    private final SysUserMapper userMapper;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public Page<ApplicationEntity> listMine(int pageNo, int pageSize, String type, String status) {
        CurrentUser user = AuthContext.required();
        Page<ApplicationEntity> page = applicationMapper.selectPage(
                Page.of(pageNo, Math.min(pageSize, 100)),
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<ApplicationEntity>lambdaQuery()
                        .eq(ApplicationEntity::getApplicantId, user.userId())
                        .eq(type != null && !type.isBlank(), ApplicationEntity::getType, type)
                        .eq(status != null && !status.isBlank(), ApplicationEntity::getStatus, status)
                        .orderByDesc(ApplicationEntity::getCreateTime)
        );
        page.setRecords(page.getRecords().stream().map(this::attachDisplayNames).toList());
        return page;
    }

    public ApplicationEntity getMine(Long id) {
        ApplicationEntity entity = applicationMapper.selectById(id);
        if (entity == null || !entity.getApplicantId().equals(AuthContext.required().userId())) {
            throw new BusinessException(404, "申请不存在");
        }
        return attachDisplayNames(entity);
    }

    public Page<ApplicationEntity> listForApproval(int pageNo, int pageSize, String type, String status) {
        AuthContext.required();
        Page<ApplicationEntity> page = applicationMapper.selectPage(
                Page.of(pageNo, Math.min(pageSize, 100)),
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<ApplicationEntity>lambdaQuery()
                        .eq(type != null && !type.isBlank(), ApplicationEntity::getType, type)
                        .eq(status != null && !status.isBlank(), ApplicationEntity::getStatus, status)
                        .orderByDesc(ApplicationEntity::getCreateTime)
        );
        page.setRecords(page.getRecords().stream().map(this::attachDisplayNames).toList());
        return page;
    }

    public ApplicationEntity getForApproval(Long id) {
        AuthContext.required();
        ApplicationEntity entity = applicationMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(404, "申请不存在");
        }
        return attachDisplayNames(entity);
    }

    @Transactional
    public ApplicationEntity create(CreateRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            if (!TYPES.contains(request.type())) {
                throw new BusinessException(1001, "不支持的申请类型");
            }
            CurrentUser user = AuthContext.required();
            LocalDateTime now = LocalDateTime.now();
            ApplicationEntity entity = new ApplicationEntity();
            entity.setAppNo(createAppNo(now));
            entity.setType(request.type());
            entity.setTitle(request.title());
            entity.setContent(request.content());
            entity.setApplicantId(user.userId());
            entity.setDeptId(user.deptId());
            entity.setStatus("PENDING");
            entity.setExtraJson(writeJson(request.extra()));
            entity.setCreateTime(now);
            entity.setUpdateTime(now);
            entity.setIsDeleted(0);
            applicationMapper.insert(entity);
            return attachDisplayNames(entity);
        });
    }

    @Transactional
    public ApplicationEntity cancel(Long id, WriteRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            ApplicationEntity entity = getMine(id);
            if (!"PENDING".equals(entity.getStatus())) {
                throw new BusinessException(1002, "当前状态不可撤回");
            }
            entity.setStatus("CANCELLED");
            entity.setUpdateTime(LocalDateTime.now());
            applicationMapper.updateById(entity);
            return attachDisplayNames(entity);
        });
    }

    @Transactional
    public ApplicationEntity approve(Long id, ApproveRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () ->
                finishApproval(id, "APPROVE", "APPROVED", null, request.comment()));
    }

    @Transactional
    public ApplicationEntity reject(Long id, RejectRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () ->
                finishApproval(id, "REJECT", "REJECTED", request.rejectReason(), request.rejectReason()));
    }

    public List<ApprovalRecord> records(Long applicationId) {
        getMine(applicationId);
        return approvalRecordMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<ApprovalRecord>lambdaQuery()
                        .eq(ApprovalRecord::getApplicationId, applicationId)
                        .orderByDesc(ApprovalRecord::getCreateTime)
        );
    }

    private ApplicationEntity finishApproval(
            Long id,
            String action,
            String afterStatus,
            String rejectReason,
            String comment
    ) {
        CurrentUser approver = AuthContext.required();
        ApplicationEntity entity = getForApproval(id);
        if (entity.getApplicantId().equals(approver.userId())) {
            throw new BusinessException(1003, "不能审批自己提交的申请");
        }
        if (!"PENDING".equals(entity.getStatus())) {
            throw new BusinessException(1002, "当前状态不可审批");
        }
        LocalDateTime now = LocalDateTime.now();
        String beforeStatus = entity.getStatus();
        entity.setStatus(afterStatus);
        entity.setRejectReason(rejectReason);
        entity.setApproverId(approver.userId());
        entity.setApproverName(approver.realName());
        entity.setApprovedAt(now);
        entity.setUpdateTime(now);
        applicationMapper.updateById(entity);

        ApprovalRecord record = new ApprovalRecord();
        record.setApplicationId(entity.getId());
        record.setOperatorId(approver.userId());
        record.setAction(action);
        record.setComment(comment);
        record.setBeforeStatus(beforeStatus);
        record.setAfterStatus(afterStatus);
        record.setCreateTime(now);
        approvalRecordMapper.insert(record);
        return attachDisplayNames(entity);
    }

    private ApplicationEntity attachDisplayNames(ApplicationEntity entity) {
        if (entity == null) {
            return null;
        }
        SysUser applicant = entity.getApplicantId() == null ? null : userMapper.selectById(entity.getApplicantId());
        if (applicant != null) {
            entity.setApplicantName(applicant.getRealName());
        }
        if ((entity.getApproverName() == null || entity.getApproverName().isBlank()) && entity.getApproverId() != null) {
            SysUser approver = userMapper.selectById(entity.getApproverId());
            if (approver != null) {
                entity.setApproverName(approver.getRealName());
            }
        }
        return entity;
    }

    private String createAppNo(LocalDateTime time) {
        return "APP" + time.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 1000);
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException exception) {
            throw new BusinessException(1001, "扩展字段格式错误");
        }
    }

    public record CreateRequest(
            String type,
            String title,
            String content,
            Map<String, Object> extra,
            String idempotencyKey
    ) {
    }

    public record WriteRequest(String idempotencyKey) {
    }

    public record ApproveRequest(String comment, String idempotencyKey) {
    }

    public record RejectRequest(@NotBlank(message = "驳回原因不能为空") String rejectReason, String idempotencyKey) {
    }
}
