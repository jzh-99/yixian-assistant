package com.zhiwei.visit;

import com.zhiwei.auth.AuthContext;
import com.zhiwei.common.exception.BusinessException;
import com.zhiwei.common.idempotency.IdempotencyService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VisitService {
    private final VisitRecordMapper visitMapper;
    private final IdempotencyService idempotencyService;

    public List<VisitRecord> list() {
        return visitMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<VisitRecord>lambdaQuery()
                        .eq(VisitRecord::getVisitorId, AuthContext.required().userId())
                        .orderByAsc(VisitRecord::getVisitTime)
        );
    }

    public VisitRecord checkin(Long id, WriteRequest request) {
        return idempotencyService.execute(request.idempotencyKey(), () -> {
            VisitRecord record = visitMapper.selectById(id);
            if (record == null || !record.getVisitorId().equals(AuthContext.required().userId())) {
                throw new BusinessException(404, "拜访记录不存在");
            }
            if (record.getCheckinTime() != null) {
                throw new BusinessException(1002, "该拜访已签到");
            }
            record.setCheckinTime(LocalDateTime.now());
            record.setUpdateTime(LocalDateTime.now());
            visitMapper.updateById(record);
            return record;
        });
    }

    public record WriteRequest(String idempotencyKey) {
    }
}
