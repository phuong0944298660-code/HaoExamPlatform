package com.jieliedu.platform.security;

import com.jieliedu.platform.utils.RedisUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Token 黑名单服务
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final RedisUtils redisUtils;
    private final JwtTokenProvider jwtTokenProvider;

    public void addToBlacklist(String token) {
        try {
            java.util.Date expiry = jwtTokenProvider.getExpirationDateFromToken(token);
            long ttl = expiry.getTime() - System.currentTimeMillis();
            if (ttl > 0) {
                redisUtils.set("token:blacklist:" + token, "blacklisted", ttl, TimeUnit.MILLISECONDS);
            }
        } catch (Exception e) {
            // Redis 不可用时，记录日志但不抛出异常，允许系统继续运行
            org.slf4j.LoggerFactory.getLogger(TokenBlacklistService.class)
                    .warn("Failed to add token to blacklist (Redis unavailable): {}", e.getMessage());
        }
    }

    public boolean isBlacklisted(String token) {
        try {
            return redisUtils.hasKey("token:blacklist:" + token);
        } catch (Exception e) {
            // Redis 不可用时，认为 token 未被加入黑名单（允许访问）
            org.slf4j.LoggerFactory.getLogger(TokenBlacklistService.class)
                    .warn("Failed to check token blacklist (Redis unavailable): {}", e.getMessage());
            return false;
        }
    }
}
