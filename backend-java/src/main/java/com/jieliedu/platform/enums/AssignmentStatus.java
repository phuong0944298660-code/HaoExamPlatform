package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 考试分配状态枚举
 */
@Getter
public enum AssignmentStatus {
    NOT_STARTED("not_started", "未开始"),
    IN_PROGRESS("in_progress", "进行中"),
    SUBMITTED("submitted", "已提交"),
    GRADING("grading", "批改中"),
    COMPLETED("completed", "已完成");
    
    private final String code;
    private final String description;
    
    AssignmentStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
