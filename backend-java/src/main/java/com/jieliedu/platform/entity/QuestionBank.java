package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 题库实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "question_banks")
public class QuestionBank extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "subject")
    private String subject;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group")
    private GradeGroup gradeGroup;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "question_count")
    private Integer questionCount = 0;

    @Column(name = "total_questions")
    private Integer totalQuestions = 0;

    @Column(name = "created_by")
    private Integer createdBy;
}
