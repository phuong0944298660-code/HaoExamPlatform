package com.jieliedu.platform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 考试实例实体（学生参加的具体考试记录）
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "exam_instances")
public class ExamInstance {

    public enum GradingStatus {
        SUBMITTED,
        AUTO_GRADED,
        GRADING_COMPLETED,
        PUBLISHED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false)
    private Long examId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "has_subjective_question")
    private Boolean hasSubjectiveQuestion;

    @Column(name = "subjective_question_count")
    private Integer subjectiveQuestionCount;

    @Column(name = "objective_score")
    private Integer objectiveScore;

    @Column(name = "subjective_score")
    private Integer subjectiveScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "graded_subjective_count")
    private Integer gradedSubjectiveCount;

    @Column(name = "graded_by")
    private Long gradedBy;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grading_status")
    private GradingStatus gradingStatus;
}
