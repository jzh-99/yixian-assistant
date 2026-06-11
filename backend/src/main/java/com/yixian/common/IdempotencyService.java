package com.yixian.common;

import java.util.function.Supplier;
import org.springframework.stereotype.Service;

/**
 * 幂等性服务 — 简化实现，直接执行操作。
 * 生产环境可替换为基于 Redis 的幂等性校验。
 */
@Service
public class IdempotencyService {
    public <T> T execute(String key, Supplier<T> action) {
        return action.get();
    }
}
