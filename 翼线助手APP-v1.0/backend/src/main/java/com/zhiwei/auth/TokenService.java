package com.zhiwei.auth;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final Map<String, CurrentUser> sessions = new ConcurrentHashMap<>();

    public String issue(CurrentUser user) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, user);
        return token;
    }

    public CurrentUser resolve(String token) {
        return sessions.get(token);
    }

    public void revoke(String token) {
        sessions.remove(token);
    }
}
