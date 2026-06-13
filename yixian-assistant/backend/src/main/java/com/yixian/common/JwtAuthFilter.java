package com.yixian.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yixian.auth.UserContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    // 不需要 Token 的路径
    private static final List<String> WHITE_LIST = List.of(
            "/api/v1/auth/login"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String path = req.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }
        if (WHITE_LIST.stream().anyMatch(path::startsWith)) {
            chain.doFilter(req, res);
            return;
        }

        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            writeError(res, 401, "未登录或Token缺失");
            return;
        }

        String token = header.substring(7);
        if (!jwtUtil.isValid(token)) {
            writeError(res, 401, "Token无效或已过期");
            return;
        }

        try {
            Claims claims = jwtUtil.parse(token);
            UserContext.set(
                    ((Number) claims.get("userId")).longValue(),
                    (String) claims.get("username"),
                    (String) claims.get("realName"),
                    (String) claims.get("roleCode"),
                    ((Number) claims.get("deptId")).longValue()
            );
            chain.doFilter(req, res);
        } finally {
            UserContext.clear();
        }
    }

    private void writeError(HttpServletResponse res, int code, String msg) throws IOException {
        res.setStatus(200);
        res.setContentType("application/json;charset=UTF-8");
        Result<?> result = Result.fail(code, msg);
        res.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
