package com.jieliedu.platform.utils;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * JWT 工具类（stub）
 */
@Component
public class JwtUtils {

    public String generateToken(Object userId, Object role, Object extra) {
        return UUID.randomUUID().toString();
    }
}
