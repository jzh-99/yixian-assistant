package com.yixian.application;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yixian.auth.SysUser;
import com.yixian.auth.SysUserMapper;
import com.yixian.auth.UserContext;
import com.yixian.common.BizException;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private static final Set<String> TYPES = Set.of("MATERIAL", "VISIT", "SUPPORT");
    private final ApplicationMapper applicationMapper;
    private final ApprovalRecordMapper approvalRecordMapper;
    private final SysUserMapper userMapper;
    private final ObjectMapper objectMapper;

    public Page<ApplicationEntity> listMine(int pageNo, int pageSize, String type, String status) {
        UserContext.CurrentUser user = UserContext.get();
        Page<ApplicationEntity> page = applicationMapper.selectPage(
                Page.of(pageNo, Math.min(pageSize, 100)),
                Wrappers.<ApplicationEntity>lambdaQuery()
                        .eq(ApplicationEntity::getApplicantId, user.getUserId())
                        .eq(type != null && !type.isBlank(), ApplicationEntity::getType, type)
                        .eq(status != null && !status.isBlank(), ApplicationEntity::getStatus, status)
                        .orderByDesc(ApplicationEntity::getCreateTime)
        );
        page.setRecords(page.getRecords().stream().map(this::attachDisplayInfo).toList());
        return page;
    }

    public ApplicationEntity getMine(Long id) {
        UserContext.CurrentUser user = UserContext.get();
        ApplicationEntity entity = applicationMapper.selectById(id);
        if (entity == null || !Objects.equals(entity.getApplicantId(), user.getUserId())) {
            throw new BizException(404, "Application not found");
        }
        return attachDisplayInfo(entity);
    }

    public Page<ApplicationEntity> listForApproval(int pageNo, int pageSize, String type, String status) {
        UserContext.get();
        Page<ApplicationEntity> page = applicationMapper.selectPage(
                Page.of(pageNo, Math.min(pageSize, 100)),
                Wrappers.<ApplicationEntity>lambdaQuery()
                        .eq(type != null && !type.isBlank(), ApplicationEntity::getType, type)
                        .eq(status != null && !status.isBlank(), ApplicationEntity::getStatus, status)
                        .orderByDesc(ApplicationEntity::getCreateTime)
        );
        page.setRecords(page.getRecords().stream().map(this::attachDisplayInfo).toList());
        return page;
    }

    public ApplicationEntity getForApproval(Long id) {
        UserContext.get();
        ApplicationEntity entity = applicationMapper.selectById(id);
        if (entity == null) {
            throw new BizException(404, "Application not found");
        }
        return attachDisplayInfo(entity);
    }

    @Transactional
    public ApplicationEntity create(CreateRequest request) {
        ApplicationEntity existing = findByIdempotencyKey(request.idempotencyKey());
        if (existing != null) {
            return attachDisplayInfo(existing);
        }
        if (!TYPES.contains(request.type())) {
            throw new BizException(1001, "Unsupported application type");
        }
        UserContext.CurrentUser user = UserContext.get();
        LocalDateTime now = LocalDateTime.now();
        ApplicationEntity entity = new ApplicationEntity();
        entity.setAppNo(createAppNo(now));
        entity.setType(request.type());
        entity.setTitle(request.title());
        entity.setContent(request.content());
        entity.setApplicantId(user.getUserId());
        entity.setDeptId(user.getDeptId());
        entity.setStatus("PENDING");
        entity.setExtraJson(writeJson(request.extra()));
        entity.setIdempotencyKey(blankToNull(request.idempotencyKey()));
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setIsDeleted(0);
        applicationMapper.insert(entity);
        return attachDisplayInfo(entity);
    }

    @Transactional
    public ApplicationEntity cancel(Long id, WriteRequest request) {
        ApplicationEntity entity = getMine(id);
        if ("CANCELLED".equals(entity.getStatus())) {
            return attachDisplayInfo(entity);
        }
        if (!"PENDING".equals(entity.getStatus())) {
            throw new BizException(1002, "Only pending applications can be cancelled");
        }
        entity.setStatus("CANCELLED");
        entity.setUpdateTime(LocalDateTime.now());
        applicationMapper.updateById(entity);
        return attachDisplayInfo(entity);
    }

    @Transactional
    public ApplicationEntity approve(Long id, ApproveRequest request) {
        return finishApproval(id, "APPROVE", "APPROVED", null, request.comment());
    }

    @Transactional
    public ApplicationEntity reject(Long id, RejectRequest request) {
        String reason = request.rejectReason() == null ? "" : request.rejectReason().trim();
        if (reason.length() < 5) {
            throw new BizException(1001, "Reject reason must be at least 5 characters");
        }
        return finishApproval(id, "REJECT", "REJECTED", reason, reason);
    }

    public List<ApprovalRecord> records(Long applicationId) {
        getMine(applicationId);
        return approvalRecords(applicationId);
    }

    private ApplicationEntity finishApproval(
            Long id,
            String action,
            String afterStatus,
            String rejectReason,
            String comment
    ) {
        UserContext.CurrentUser approver = UserContext.get();
        ApplicationEntity entity = applicationMapper.selectById(id);
        if (entity == null) {
            throw new BizException(404, "Application not found");
        }
        if (Objects.equals(entity.getApplicantId(), approver.getUserId())) {
            throw new BizException(1003, "Applicants cannot approve their own applications");
        }
        if (afterStatus.equals(entity.getStatus())) {
            return attachDisplayInfo(entity);
        }
        if (!"PENDING".equals(entity.getStatus())) {
            throw new BizException(1002, "Only pending applications can be approved or rejected");
        }

        LocalDateTime now = LocalDateTime.now();
        String beforeStatus = entity.getStatus();
        entity.setStatus(afterStatus);
        entity.setRejectReason(rejectReason);
        entity.setApproverId(approver.getUserId());
        entity.setApproverName(approver.getRealName());
        entity.setApprovedAt(now);
        entity.setUpdateTime(now);
        applicationMapper.updateById(entity);

        ApprovalRecord record = new ApprovalRecord();
        record.setApplicationId(entity.getId());
        record.setOperatorId(approver.getUserId());
        record.setOperatorName(approver.getRealName());
        record.setAction(action);
        record.setComment(comment);
        record.setBeforeStatus(beforeStatus);
        record.setAfterStatus(afterStatus);
        record.setCreateTime(now);
        approvalRecordMapper.insert(record);
        return attachDisplayInfo(entity);
    }

    private ApplicationEntity attachDisplayInfo(ApplicationEntity entity) {
        if (entity == null) {
            return null;
        }
        SysUser applicant = entity.getApplicantId() == null ? null : userMapper.selectById(entity.getApplicantId());
        if (applicant != null) {
            entity.setApplicantName(applicant.getRealName());
        }

        List<ApprovalRecord> records = approvalRecords(entity.getId());
        entity.setRecords(records);

        ApprovalRecord approvalRecord = records.stream()
                .filter(item -> "APPROVE".equals(item.getAction()) || "REJECT".equals(item.getAction()))
                .findFirst()
                .orElse(null);
        if ((entity.getApproverName() == null || entity.getApproverName().isBlank()) && entity.getApproverId() != null) {
            SysUser approver = userMapper.selectById(entity.getApproverId());
            if (approver != null) {
                entity.setApproverName(approver.getRealName());
            }
        }
        if ((entity.getApproverName() == null || entity.getApproverName().isBlank()) && approvalRecord != null) {
            if (approvalRecord.getOperatorName() != null && !approvalRecord.getOperatorName().isBlank()) {
                entity.setApproverName(approvalRecord.getOperatorName());
            } else if (approvalRecord.getOperatorId() != null) {
                SysUser approver = userMapper.selectById(approvalRecord.getOperatorId());
                if (approver != null) {
                    entity.setApproverName(approver.getRealName());
                    approvalRecord.setOperatorName(approver.getRealName());
                }
            }
        }
        if (entity.getApprovedAt() == null && approvalRecord != null) {
            entity.setApprovedAt(approvalRecord.getCreateTime());
        }
        return entity;
    }

    private List<ApprovalRecord> approvalRecords(Long applicationId) {
        if (applicationId == null) {
            return List.of();
        }
        return approvalRecordMapper.selectList(
                Wrappers.<ApprovalRecord>lambdaQuery()
                        .eq(ApprovalRecord::getApplicationId, applicationId)
                        .orderByDesc(ApprovalRecord::getCreateTime)
        );
    }

    private ApplicationEntity findByIdempotencyKey(String key) {
        String cleanKey = blankToNull(key);
        if (cleanKey == null) {
            return null;
        }
        return applicationMapper.selectOne(
                Wrappers.<ApplicationEntity>lambdaQuery()
                        .eq(ApplicationEntity::getIdempotencyKey, cleanKey)
                        .last("limit 1")
        );
    }

    private String createAppNo(LocalDateTime time) {
        return "APP" + time.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 1000);
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException exception) {
            throw new BizException(1001, "Invalid application extra fields");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
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

    public record RejectRequest(@NotBlank(message = "Reject reason is required") String rejectReason, String idempotencyKey) {
    }
}
