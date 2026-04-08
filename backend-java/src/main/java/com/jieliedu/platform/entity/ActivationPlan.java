package com.jieliedu.platform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.enums.StatusEnum;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

/**
 * 激活计划实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "activation_plans")
public class ActivationPlan extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @JsonProperty("target_role")
    @Column(name = "target_role")
    private String targetRole;

    @JsonProperty("target_grade_group")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "target_grade_group")
    private GradeGroup targetGradeGroup;

    @JsonProperty("validity_days")
    @Column(name = "validity_days")
    private Integer validityDays;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "permissions", columnDefinition = "JSON")
    private String permissions;

    /** 关联的题库ID数组，JSON格式: [1,2,3] */
    @JsonProperty("question_bank_ids")
    @Column(name = "question_bank_ids", columnDefinition = "JSON")
    private String questionBankIds;

    /** 关联的资源ID数组，JSON格式: [1,2,3] */
    @JsonProperty("resource_ids")
    @Column(name = "resource_ids", columnDefinition = "JSON")
    private String resourceIds;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "is_online_sale")
    private Boolean isOnlineSale = false;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status")
    private StatusEnum status = StatusEnum.ENABLED;

    @Column(name = "max_activations")
    private Integer maxActivations = 0;

    @Column(name = "total_generated")
    private Integer totalGenerated = 0;

    @Column(name = "total_used")
    private Integer totalUsed = 0;

    @Column(name = "created_by")
    private Integer createdBy;

    // --- 增强的字段映射 ---

    @JsonProperty("target_role")
    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    @JsonProperty("target_grade_group")
    public void setTargetGradeGroup(GradeGroup targetGradeGroup) {
        this.targetGradeGroup = targetGradeGroup;
    }

    @JsonProperty("validity_days")
    public void setValidityDays(Integer validityDays) {
        this.validityDays = validityDays;
    }

    @JsonProperty("is_active")
    public void setIsOnlineSale(Boolean isOnlineSale) {
        this.isOnlineSale = isOnlineSale;
    }

    // --- Explicit Getters and Setters to bypass Lombok issues ---
    
    public Integer getMaxActivations() {
        return maxActivations != null ? maxActivations : 0;
    }

    @JsonProperty("max_activations")
    public void setMaxActivations(Integer maxActivations) {
        this.maxActivations = maxActivations;
    }

    public Integer getTotalGenerated() {
        return totalGenerated != null ? totalGenerated : 0;
    }

    public void setTotalGenerated(Integer totalGenerated) {
        this.totalGenerated = totalGenerated;
    }

    public Integer getTotalUsed() {
        return totalUsed != null ? totalUsed : 0;
    }

    public void setTotalUsed(Integer totalUsed) {
        this.totalUsed = totalUsed;
    }
}
