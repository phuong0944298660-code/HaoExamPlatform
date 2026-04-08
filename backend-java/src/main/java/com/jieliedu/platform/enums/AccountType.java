package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 账号类型枚举
 */
@Getter
public enum AccountType {
    PRACTICE("practice", "赛前练习账号"),
    EXAM("exam", "赛中考试账号"),
    SYSTEM("system", "系统账号");
    
    private final String code;
    private final String description;
    
    AccountType(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
