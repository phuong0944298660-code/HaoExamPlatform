package com.jieliedu.platform.dto.response;

import lombok.Data;

/**
 * 登录响应
 */
@Data
public class LoginResponse {
    
    private String token;
    private UserInfo user;
    
    @Data
    public static class UserInfo {
        private Integer id;
        private String accountType;
        private String gradeGroup;
        private String role;
        private String identityNo;
        private String username;
        private String name;
        private String school;
        private String region;
        private Boolean isActivated;
        private Boolean isActive;
    }
}
