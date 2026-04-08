package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 激活码状态枚举
 */
@Getter
public enum ActivationCodeStatus {
    UNUSED("unused", "未使用"),
    USED("used", "已使用"),
    EXPIRED("expired", "已过期");
    
    private final String code;
    private final String description;
    
    ActivationCodeStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
