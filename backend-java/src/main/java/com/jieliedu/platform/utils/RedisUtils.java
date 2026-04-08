package com.jieliedu.platform.utils;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Redis 工具类
 */
@Component
@RequiredArgsConstructor
public class RedisUtils {

    private final RedisTemplate<String, Object> redisTemplate;

    public boolean hasKey(@NonNull String key) {
        Boolean result = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(result);
    }

    public void set(@NonNull String key, @NonNull Object value, long timeout, @NonNull TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    public Object get(@NonNull String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void delete(@NonNull String key) {
        redisTemplate.delete(key);
    }
}
