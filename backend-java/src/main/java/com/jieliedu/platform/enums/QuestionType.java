package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 题目类型枚举
 */
@Getter
public enum QuestionType {
    SINGLE_CHOICE("single_choice", "单选题"),
    MULTIPLE_CHOICE("multiple_choice", "多选题"),
    MULTI_CHOICE("multi_choice", "多选题"),
    TRUE_FALSE("true_false", "判断题"),
    JUDGMENT("judgment", "判断题"),
    FILL_BLANK("fill_blank", "填空题"),
    SUBJECTIVE("subjective", "主观题"),
    ESSAY("essay", "论述题");
    
    private final String code;
    private final String description;
    
    QuestionType(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
