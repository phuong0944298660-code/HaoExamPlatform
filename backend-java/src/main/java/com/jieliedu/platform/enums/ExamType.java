package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 考试类型枚举
 */
@Getter
public enum ExamType {
    PRACTICE("practice", "练习"),
    FORMAL("formal", "正式考试"),
    OFFICIAL("official", "正式考试");
    
    private final String code;
    private final String description;
    
    ExamType(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
