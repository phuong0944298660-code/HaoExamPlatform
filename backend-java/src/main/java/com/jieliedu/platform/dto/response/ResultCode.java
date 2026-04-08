package com.jieliedu.platform.dto.response;

import lombok.Getter;

/**
 * 响应状态码枚举
 */
@Getter
public enum ResultCode {
    SUCCESS(200, "操作成功"),
    ERROR(500, "操作失败"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    
    // 账号相关
    ACCOUNT_NOT_FOUND(1001, "账号不存在"),
    ACCOUNT_ALREADY_ACTIVATED(1002, "账号已激活"),
    ACCOUNT_NOT_ACTIVATED(1003, "账号未激活"),
    ACCOUNT_DISABLED(1004, "账号已禁用"),
    INVALID_PASSWORD(1005, "密码错误"),
    INVALID_ACTIVATION_CODE(1006, "无效的激活码"),
    IDENTITY_NO_EXISTS(1007, "身份证号已存在"),
    USERNAME_EXISTS(1008, "用户名已存在"),
    
    // 考试相关
    EXAM_NOT_FOUND(2001, "考试不存在"),
    EXAM_ALREADY_STARTED(2002, "考试已开始"),
    EXAM_NOT_STARTED(2003, "考试未开始"),
    EXAM_ALREADY_ENDED(2004, "考试已结束"),
    EXAM_NOT_SUBMITTED(2005, "考试未提交"),
    
    // 试卷相关
    PAPER_NOT_FOUND(3001, "试卷不存在"),
    
    // 题目相关
    QUESTION_NOT_FOUND(4001, "题目不存在");
    
    private final int code;
    private final String message;
    
    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
