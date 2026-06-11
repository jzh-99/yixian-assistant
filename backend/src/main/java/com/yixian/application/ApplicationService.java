package com.yixian.application;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yixian.auth.UserContext;
import com.yixian.auth.UserContext.CurrentUser;
import com.yixian.common.BizException;
import com.yixian.common.IdempotencyService;
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
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public Page<ApplicationEntity> list(int pageNo, int pageSize, String type, String status) {
        CurrentUser user = UserContext.get();
        return applicationMapper.selectPage(
                Page.of(pageNo, Math.min(pageSize, 100)),
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<ApplicationEntity>lambdaQuery()
                        .eq(ApplicationEntity::getApplicantId, user.getUserId())
                        .eq(type != null && !type.isBlank(), ApplicationEntity::getType, type)
                        .eq(status != null && !status.isBlank(), ApplicationEntity::getStatus, status)
                        .orderByDesc(ApplicationEntity::getCreateTime)
        );
    }

    public ApplicationEntity get(Long id) {
        ApplicationEntity entity = applicationMapper.selectById(id);
        if (entity == null || !entity.getApplicantId().equals(UserContext.get().getUserId())) {
            throw new BizException(404, "申请不存在");
        }
        return entity;
    }

    @Transactional
    public ApplicationEntity create(CreateRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            if (!TYPES.contains(request.type())) {
                throw new BizException(1001, "不支持的申请类型");
            }
            CurrentUser user = UserContext.get();
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
            entity.setCreateTime(now);
            entity.setUpdateTime(now);
            entity.setIsDeleted(0);
            applicationMapper.insert(entity);
            return entity;
        });
    }

    @Transactional
    public ApplicationEntity cancel(Long id, WriteRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            ApplicationEntity entity = get(id);
            if (!"PENDING".equals(entity.getStatus())) {
                throw new BizException(1002, "当前状态不可撤回");
            }
            entity.setStatus("CANCELLED");
            entity.setUpdateTime(LocalDateTime.now());
            applicationMapper.updateById(entity);
            return entity;
        });
    }

    public List<ApprovalRecord> records(Long applicationId) {
        get(applicationId);
        return approvalRecordMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<ApprovalRecord>lambdaQuery()
                        .eq(ApprovalRecord::getApplicationId, applicationId)
                        .orderByDesc(ApprovalRecord::getCreateTime)
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
            throw new BizException(1001, "扩展字段格式错误");
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
}
