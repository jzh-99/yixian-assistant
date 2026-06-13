package com.zhiwei.auth;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.zhiwei.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final SysUserMapper userMapper;
    private final SysDeptMapper deptMapper;
    private final TokenService tokenService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public LoginResult login(String username, String password) {
        SysUser user = userMapper.selectOne(Wrappers.<SysUser>lambdaQuery()
                .and(query -> query.eq(SysUser::getUsername, username)
                        .or()
                        .eq(SysUser::getEmployeeNo, username))
                .eq(SysUser::getStatus, 1));
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(1002, "工号或密码错误");
        }
        SysDept dept = user.getDeptId() == null ? null : deptMapper.selectById(user.getDeptId());
        CurrentUser currentUser = new CurrentUser(
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getRoleCode(),
                user.getDeptId(),
                dept == null ? null : dept.getName(),
                user.getEmployeeNo()
        );
        return new LoginResult(tokenService.issue(currentUser));
    }

    public record LoginResult(String token) {
    }
}
