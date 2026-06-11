package com.yixian.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yixian.common.BizException;
import com.yixian.common.JwtUtil;
import com.yixian.common.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;

    @PostMapping("/login")
    public Result<LoginResp> login(@RequestBody LoginReq req) {
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUsername, req.getUsername())
                        .eq(SysUser::getIsDeleted, 0)
        );
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword())) {
            throw new BizException(1001, "账号或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new BizException(1002, "账号已停用");
        }

        Map<String, Object> claims = Map.of(
                "userId",   user.getId(),
                "username", user.getUsername(),
                "realName", user.getRealName(),
                "roleCode", user.getRoleCode(),
                "deptId",   user.getDeptId() != null ? user.getDeptId() : 0L
        );
        String token = jwtUtil.generate(claims);

        LoginResp resp = new LoginResp();
        resp.setToken(token);
        resp.setUserId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setRealName(user.getRealName());
        resp.setRoleCode(user.getRoleCode());
        resp.setDeptId(user.getDeptId());
        return Result.ok(resp);
    }

    @GetMapping("/me")
    public Result<UserContext.CurrentUser> me() {
        return Result.ok(UserContext.get());
    }

    @Data
    static class LoginReq {
        private String username;
        private String password;
    }

    @Data
    static class LoginResp {
        private String token;
        private Long userId;
        private String username;
        private String realName;
        private String roleCode;
        private Long deptId;
    }
}
