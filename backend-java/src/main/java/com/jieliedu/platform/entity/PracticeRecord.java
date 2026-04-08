package com.jieliedu.platform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 练习记录实体 — 记录每次答题情况
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "practice_records",
        indexes = {
            @Index(name = "idx_pr_account_id", columnList = "account_id"),
            @Index(name = "idx_pr_question_id", columnList = "question_id"),
            @Index(name = "idx_pr_question_bank_id", columnList = "question_bank_id")
        })
public class PracticeRecord extends BaseEntity {

    @Column(name = "account_id", nullable = false)
    private Integer accountId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Column(name = "question_bank_id", nullable = false)
    private Integer questionBankId;

    @Column(name = "student_answer", columnDefinition = "TEXT")
    private String studentAnswer;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;

    @Column(name = "practice_at", nullable = false)
    private LocalDateTime practiceAt;
}
