package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.ActivationCodeStatus;
import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * 激活码实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "activation_codes")
public class ActivationCode extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "plan_id")
    private Integer planId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group", nullable = false)
    private GradeGroup gradeGroup;

    @Column(name = "user_role", nullable = false)
    private String userRole;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false)
    private ActivationCodeStatus status = ActivationCodeStatus.UNUSED;

    @Column(name = "source")
    private String source;

    @Column(name = "distribution_type")
    private String distributionType;

    @Column(name = "batch_no")
    private String batchNo;

    @Column(name = "used_by")
    private Integer usedBy;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;

    @Column(name = "created_by")
    private Integer createdBy;
}
