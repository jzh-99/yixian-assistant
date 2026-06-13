package com.zhiwei.common.idempotency;

import com.zhiwei.common.exception.BusinessException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {
    private final Map<String, Instant> keys = new ConcurrentHashMap<>();
    private final Duration ttl = Duration.ofHours(24);

    public <T> T execute(String key, Supplier<T> action) {
        if (key == null || key.isBlank()) {
            throw new BusinessException(1001, "idempotencyKey 不能为空");
        }
        Instant now = Instant.now();
        keys.entrySet().removeIf(entry -> entry.getValue().plus(ttl).isBefore(now));
        if (keys.putIfAbsent(key, now) != null) {
            throw new BusinessException(1002, "请勿重复提交");
        }
        try {
            return action.get();
        } catch (RuntimeException exception) {
            keys.remove(key);
            throw exception;
        }
    }
}
