package com.jieliedu.platform.dto.response;

import com.jieliedu.platform.enums.AccountStatus;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 账号响应
 */
@Data
public class AccountResponse {
    
    private Integer id;
    private AccountType accountType;
    private GradeGroup gradeGroup;
    private String role;
    private String identityNo;
    private String username;
    private String name;
    private String school;
    private String region;
    private String contactPhone;
    private Boolean isActivated;
    private Boolean isActive;
    private AccountStatus status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private Integer version;
}
