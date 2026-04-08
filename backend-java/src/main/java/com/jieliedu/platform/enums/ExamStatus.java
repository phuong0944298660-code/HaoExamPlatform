package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 考试状态枚举
 */
@Getter
public enum ExamStatus {
    DRAFT("draft", "草稿"),
    PENDING("pending", "待开始"),
    PUBLISHED("published", "已发布"),
    IN_PROGRESS("in_progress", "进行中"),
    ENDED("ended", "已结束"),
    CANCELLED("cancelled", "已取消");
    
    private final String code;
    private final String description;
    
    ExamStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
