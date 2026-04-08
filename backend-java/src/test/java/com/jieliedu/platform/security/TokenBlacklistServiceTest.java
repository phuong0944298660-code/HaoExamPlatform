package com.jieliedu.platform.security;

import com.jieliedu.platform.utils.RedisUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Token 黑名单服务测试
 */
@SpringBootTest
public class TokenBlacklistServiceTest {

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @MockBean
    private RedisUtils redisUtils;

    @MockBean
    private JwtTokenProvider tokenProvider;

    @Test
    public void testAddToBlacklist_Success() {
        // 准备测试数据
        String token = "test-token";
        long futureTime = System.currentTimeMillis() + 3600000; // 1小时后
        
        when(tokenProvider.getExpirationDateFromToken(token))
                .thenReturn(new Date(futureTime));
        when(redisUtils.hasKey(anyString())).thenReturn(true);

        // 执行测试
        tokenBlacklistService.addToBlacklist(token);

        // 验证结果
        verify(redisUtils).set(anyString(), eq("blacklisted"), anyLong(), eq(TimeUnit.MILLISECONDS));
    }

    @Test
    public void testIsBlacklisted_True() {
        // 准备测试数据
        String token = "blacklisted-token";
        
        when(redisUtils.hasKey("token:blacklist:" + token))
                .thenReturn(true);

        // 执行测试
        boolean result = tokenBlacklistService.isBlacklisted(token);

        // 验证结果
        assertTrue(result);
    }

    @Test
    public void testIsBlacklisted_False() {
        // 准备测试数据
        String token = "valid-token";
        
        when(redisUtils.hasKey("token:blacklist:" + token))
                .thenReturn(false);

        // 执行测试
        boolean result = tokenBlacklistService.isBlacklisted(token);

        // 验证结果
        assertFalse(result);
    }

    @Test
    public void testAddToBlacklist_ExpiredToken() {
        // 准备测试数据 - 已过期的token
        String token = "expired-token";
        long pastTime = System.currentTimeMillis() - 3600000; // 1小时前
        
        when(tokenProvider.getExpirationDateFromToken(token))
                .thenReturn(new Date(pastTime));

        // 执行测试
        tokenBlacklistService.addToBlacklist(token);

        // 验证结果 - 过期token不应该被添加到黑名单
        verify(redisUtils, never()).set(anyString(), any(), anyLong(), any());
    }
}
