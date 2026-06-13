package com.zhiwei.auth;

import com.zhiwei.common.exception.BusinessException;

public final class AuthContext {
    private static final ThreadLocal<CurrentUser> HOLDER = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void set(CurrentUser user) {
        HOLDER.set(user);
    }

    public static CurrentUser required() {
        CurrentUser user = HOLDER.get();
        if (user == null) {
            throw new BusinessException(401, "未登录或 Token 已失效");
        }
        return user;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
