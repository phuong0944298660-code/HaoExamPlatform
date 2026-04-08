package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 账号状态枚举
 */
@Getter
public enum AccountStatus {
    ACTIVE("active", "正常"),
    INACTIVE("inactive", "未激活"),
    DISABLED("disabled", "已禁用"),
    LOCKED("locked", "已锁定");
    
    private final String code;
    private final String description;
    
    AccountStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
