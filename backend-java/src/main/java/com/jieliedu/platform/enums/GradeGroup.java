package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 学段分组枚举
 */
@Getter
public enum GradeGroup {
    PRIMARY("primary", "小学组"),
    MIDDLE("middle", "初中组"),
    JUNIOR("junior", "初中组"),
    HIGH("high", "高中组"),
    ALL("all", "全学段");
    
    private final String code;
    private final String description;
    
    GradeGroup(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @com.fasterxml.jackson.annotation.JsonValue
    public String getCode() {
        return code;
    }

    @com.fasterxml.jackson.annotation.JsonCreator
    public static GradeGroup fromCode(Object code) {
        if (code == null) return null;
        String s = code.toString().trim();
        for (GradeGroup g : values()) {
            if (g.code.equalsIgnoreCase(s) || g.name().equalsIgnoreCase(s)) {
                return g;
            }
        }
        return PRIMARY; // Default to PRIMARY if unknown for robustness in testing
    }

}
