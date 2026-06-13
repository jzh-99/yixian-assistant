package com.zhiwei.auth;

public record CurrentUser(
        Long userId,
        String username,
        String realName,
        String roleCode,
        Long deptId,
        String deptName,
        String employeeNo
) {
}
