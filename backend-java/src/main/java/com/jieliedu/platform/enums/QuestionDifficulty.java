package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 题目难度枚举
 */
@Getter
public enum QuestionDifficulty {
    EASY("easy", "简单"),
    MEDIUM("medium", "中等"),
    HARD("hard", "困难");
    
    private final String code;
    private final String description;
    
    QuestionDifficulty(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
