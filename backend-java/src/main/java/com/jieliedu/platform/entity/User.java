package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.GenderEnum;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * 用户实体（扩展信息）
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    
    @Column(name = "account_id", nullable = false, unique = true)
    private Integer accountId;
    
    @Column(name = "real_name")
    private String realName;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "gender")
    private GenderEnum gender;
    
    @Column(name = "birth_date")
    private String birthDate;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
}
