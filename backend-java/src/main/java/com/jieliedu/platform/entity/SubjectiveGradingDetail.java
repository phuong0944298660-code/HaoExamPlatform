package com.jieliedu.platform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

/**
 * 主观题评分详情实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "subjective_grading_details")
public class SubjectiveGradingDetail {

    public enum GradingStatus {
        PENDING,
        GRADED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "instance_id", nullable = false)
    private Long instanceId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "full_score", precision = 10, scale = 2)
    private BigDecimal fullScore;

    @Column(name = "score", precision = 10, scale = 2)
    private BigDecimal score;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grading_status")
    private GradingStatus gradingStatus;

    @Column(name = "graded_by")
    private Long gradedBy;
}
