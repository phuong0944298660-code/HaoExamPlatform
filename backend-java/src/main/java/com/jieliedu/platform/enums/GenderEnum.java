package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 性别枚举
 */
@Getter
public enum GenderEnum {
    MALE("male", "男"),
    FEMALE("female", "女"),
    OTHER("other", "其他");
    
    private final String code;
    private final String description;
    
    GenderEnum(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
