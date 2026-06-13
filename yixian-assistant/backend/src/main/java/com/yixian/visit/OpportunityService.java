package com.yixian.visit;

import com.yixian.auth.UserContext;
import com.yixian.auth.UserContext.CurrentUser;
import com.yixian.common.BizException;
import com.yixian.common.IdempotencyService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OpportunityService {
    private static final Set<String> STATUSES = Set.of("NEW", "FOLLOWING", "HIGH_INTENT", "SIGNED", "CLOSED");
    private final OpportunityMapper opportunityMapper;
    private final OpportunityFollowMapper followMapper;
    private final CustomerMapper customerMapper;
    private final IdempotencyService idempotencyService;

    public List<Opportunity> list(String status) {
        return opportunityMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<Opportunity>lambdaQuery()
                        .eq(Opportunity::getManagerId, UserContext.get().getUserId())
                        .eq(status != null && !status.isBlank(), Opportunity::getStatus, status)
                        .orderByDesc(Opportunity::getUpdateTime)
        );
    }

    @Transactional
    public Opportunity create(WriteRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            validateStatus(request.status());
            CurrentUser user = UserContext.get();
            LocalDateTime now = LocalDateTime.now();
            Opportunity entity = new Opportunity();
            entity.setOpportunityNo(createNo(now));
            entity.setCustomerId(resolveCustomer(request.customerId(), request.customerName(), user.getUserId()));
            entity.setManagerId(user.getUserId());
            entity.setTitle(request.title());
            entity.setStatus(request.status());
            entity.setIntentLevel(request.intentLevel());
            entity.setEstimatedAmount(request.estimatedAmount());
            entity.setNextContactTime(parseDateTime(request.nextContactTime()));
            entity.setDescription(request.description());
            entity.setCreateTime(now);
            entity.setUpdateTime(now);
            entity.setIsDeleted(0);
            opportunityMapper.insert(entity);
            return entity;
        });
    }

    @Transactional
    public Opportunity update(Long id, WriteRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            Opportunity entity = opportunityMapper.selectById(id);
            Long currentUserId = UserContext.get().getUserId();
            if (entity == null || !entity.getManagerId().equals(currentUserId)) {
                throw new BizException(404, "商机不存在");
            }
            if (request.status() != null) {
                validateStatus(request.status());
                entity.setStatus(request.status());
            }
            if (request.customerId() != null || request.customerName() != null) {
                entity.setCustomerId(resolveCustomer(request.customerId(), request.customerName(), entity.getManagerId()));
            }
            if (request.title() != null) entity.setTitle(request.title());
            if (request.intentLevel() != null) entity.setIntentLevel(request.intentLevel());
            if (request.estimatedAmount() != null) entity.setEstimatedAmount(request.estimatedAmount());
            if (request.nextContactTime() != null) entity.setNextContactTime(parseDateTime(request.nextContactTime()));
            if (request.description() != null) entity.setDescription(request.description());
            if (request.followUp() != null && request.followUp().content() != null) {
                OpportunityFollowRecord follow = new OpportunityFollowRecord();
                follow.setOpportunityId(id);
                follow.setOperatorId(currentUserId);
                follow.setContent(request.followUp().content());
                follow.setNextContactTime(parseDateTime(request.nextContactTime()));
                follow.setCreateTime(LocalDateTime.now());
                followMapper.insert(follow);
                entity.setLastFollowTime(LocalDateTime.now());
            }
            entity.setUpdateTime(LocalDateTime.now());
            opportunityMapper.updateById(entity);
            return entity;
        });
    }

    private Long resolveCustomer(Long customerId, String customerName, Long managerId) {
        if (customerId != null) return customerId;
        if (customerName == null || customerName.isBlank()) {
            throw new BizException(1001, "客户不能为空");
        }
        Customer existing = customerMapper.selectOne(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<Customer>lambdaQuery()
                        .eq(Customer::getName, customerName)
                        .eq(Customer::getManagerId, managerId)
                        .last("LIMIT 1")
        );
        if (existing != null) return existing.getId();
        Customer customer = new Customer();
        customer.setName(customerName);
        customer.setManagerId(managerId);
        customer.setCreateTime(LocalDateTime.now());
        customer.setUpdateTime(LocalDateTime.now());
        customer.setIsDeleted(0);
        customerMapper.insert(customer);
        return customer.getId();
    }

    private void validateStatus(String status) {
        if (status == null || !STATUSES.contains(status)) {
            throw new BizException(1001, "商机状态不正确");
        }
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String createNo(LocalDateTime time) {
        return "SJ" + time.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(10, 100);
    }

    public record FollowUp(String content) {
    }

    public record WriteRequest(
            Long customerId,
            String customerName,
            String title,
            String status,
            String intentLevel,
            Long estimatedAmount,
            String nextContactTime,
            String description,
            FollowUp followUp,
            String idempotencyKey
    ) {
    }
}
