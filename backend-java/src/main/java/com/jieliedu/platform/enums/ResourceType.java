package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 资源类型枚举
 */
@Getter
public enum ResourceType {
    IMAGE("image", "图片"),
    VIDEO("video", "视频"),
    AUDIO("audio", "音频"),
    DOCUMENT("document", "文档"),
    OTHER("other", "其他");
    
    private final String code;
    private final String description;
    
    ResourceType(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
