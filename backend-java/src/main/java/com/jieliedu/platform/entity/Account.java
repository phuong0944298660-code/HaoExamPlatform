package com.jieliedu.platform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * 账号实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "accounts")
public class Account extends BaseEntity {
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "account_type", nullable = false)
    @JsonProperty("account_type")
    private AccountType accountType;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group", nullable = false)
    @JsonProperty("grade_group")
    private GradeGroup gradeGroup;
    
    @Column(name = "role", nullable = false)
    private String role = "student";
    
    @Column(name = "identity_no", unique = true)
    @JsonProperty("identity_no")
    private String identityNo;
    
    @Column(name = "username", unique = true)
    private String username;
    
    @Column(name = "hashed_password", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY, value = "hashed_password")
    private String hashedPassword;

    @Transient
    @JsonProperty("password")
    private String password;
    
    @Column(name = "is_activated")
    @JsonProperty("is_activated")
    private Boolean isActivated = false;
    
    @Column(name = "activation_code_id")
    @JsonProperty("activation_code_id")
    private Integer activationCodeId;
    
    @Column(name = "name")
    @JsonProperty("nickname")
    private String name;
    
    @Column(name = "school")
    private String school;
    
    @Column(name = "class_id")
    @JsonProperty("class_id")
    private Integer classId;
    
    @Column(name = "region")
    private String region;
    
    @Column(name = "contact_phone")
    @JsonProperty("contact_phone")
    private String contactPhone;
    
    @Column(name = "last_login_at")
    @JsonProperty("last_login_at")
    private LocalDateTime lastLoginAt;
    
    @Column(name = "last_login_ip")
    @JsonProperty("last_login_ip")
    private String lastLoginIp;
    
    @Column(name = "session_token")
    @JsonProperty("session_token")
    private String sessionToken;
    
    @Column(name = "is_active")
    @JsonProperty("is_active")
    private Boolean isActive = true;

    /**
     * 获取登录账号：练习账号用username，考试账号用identity_no
     */
    @Transient
    public String getLoginAccount() {
        return username != null ? username : identityNo;
    }

    /**
     * 获取显示名称
     */
    @Transient
    public String getDisplayName() {
        return name != null ? name : username;
    }
}
