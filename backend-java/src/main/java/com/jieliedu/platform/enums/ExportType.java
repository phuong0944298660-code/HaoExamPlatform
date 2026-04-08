package com.jieliedu.platform.enums;

import lombok.Getter;

/**
 * 导出类型枚举
 */
@Getter
public enum ExportType {
    PDF("pdf", "PDF文档"),
    CSV("csv", "CSV文件"),
    EXCEL("excel", "Excel文件");
    
    private final String code;
    private final String description;
    
    ExportType(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
