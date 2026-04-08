package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 通用状态枚举
 */
@Getter
public enum StatusEnum {
    ENABLED("enabled", "启用"),
    DISABLED("disabled", "禁用");
    
    private final String code;
    private final String description;
    
    StatusEnum(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
