package com.zhiwei.auth;

import com.zhiwei.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final TokenService tokenService;

    @PostMapping("/login")
    public ApiResponse<AuthService.LoginResult> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request.username(), request.password()));
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUser> me() {
        return ApiResponse.success(AuthContext.required());
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        tokenService.revoke(request.getHeader("Authorization").substring(7));
        return ApiResponse.success();
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }
}
