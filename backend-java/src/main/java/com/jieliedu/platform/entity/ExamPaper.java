package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

/**
 * 试卷实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "exam_papers")
public class ExamPaper extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group", nullable = false)
    private GradeGroup gradeGroup;

    @Column(name = "status", nullable = false)
    private String status = "DRAFT";

    @Column(name = "total_score", precision = 10, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "question_count")
    private Integer questionCount;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "question_bank_id")
    private Integer questionBankId;

    @Column(name = "duration")
    private Integer duration;

}
