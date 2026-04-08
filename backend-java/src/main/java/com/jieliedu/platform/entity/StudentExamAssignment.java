package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.AssignmentStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 学生考试分配实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "student_exam_assignments")
public class StudentExamAssignment extends BaseEntity {

    @Column(name = "account_id", nullable = false)
    private Integer accountId;

    @Column(name = "exam_id", nullable = false)
    private Integer examId;

    @Column(name = "assigned_paper_id", nullable = false)
    private Integer assignedPaperId;

    @Column(name = "paper_id")
    private Integer paperId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false)
    private AssignmentStatus status = AssignmentStatus.NOT_STARTED;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "submission_ip")
    private String submissionIp;

    @Column(name = "objective_score")
    private BigDecimal objectiveScore;

    @Column(name = "subjective_score")
    private BigDecimal subjectiveScore;

    @Column(name = "total_score")
    private BigDecimal totalScore;

    @Column(name = "answers", columnDefinition = "TEXT")
    private String answers;

    @Column(name = "answers_snapshot", columnDefinition = "TEXT")
    private String answersSnapshot;

    @Column(name = "graded_by")
    private Integer gradedBy;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(name = "grading_comments", columnDefinition = "TEXT")
    private String gradingComments;

    @Column(name = "is_cheating_suspected")
    private Boolean isCheatingsSuspected;

    @Column(name = "tab_switch_count")
    private Integer tabSwitchCount;
}
