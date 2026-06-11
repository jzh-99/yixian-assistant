package com.yixian.auth;

import lombok.Data;

/**
 * 线程本地存储当前登录用户信息，所有业务代码通过 UserContext.get() 获取，不重复解析 Token
 */
public class UserContext {

    private static final ThreadLocal<CurrentUser> HOLDER = new ThreadLocal<>();

    public static void set(Long userId, String username, String realName, String roleCode, Long deptId) {
        CurrentUser u = new CurrentUser();
        u.setUserId(userId);
        u.setUsername(username);
        u.setRealName(realName);
        u.setRoleCode(roleCode);
        u.setDeptId(deptId);
        HOLDER.set(u);
    }

    public static CurrentUser get() {
        CurrentUser u = HOLDER.get();
        if (u == null) throw new com.yixian.common.BizException(401, "未登录");
        return u;
    }

    public static void clear() {
        HOLDER.remove();
    }

    @Data
    public static class CurrentUser {
        private Long userId;
        private String username;
        private String realName;
        private String roleCode;
        private Long deptId;
    }
}
