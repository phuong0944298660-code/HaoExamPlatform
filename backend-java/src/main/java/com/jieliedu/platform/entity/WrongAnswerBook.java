package com.jieliedu.platform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 错题本实体 — 记录用户答错的题目
 * 同一账号+同一题目只有一条记录，多次答错叠加 wrongCount
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "wrong_answer_books",
        uniqueConstraints = @UniqueConstraint(name = "uk_wab_account_question",
                columnNames = {"account_id", "question_id"}),
        indexes = {
            @Index(name = "idx_wab_account_id", columnList = "account_id"),
            @Index(name = "idx_wab_question_bank_id", columnList = "question_bank_id")
        })
public class WrongAnswerBook extends BaseEntity {

    @Column(name = "account_id", nullable = false)
    private Integer accountId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Column(name = "question_bank_id", nullable = false)
    private Integer questionBankId;

    /** 答错次数，每次答错 +1 */
    @Column(name = "wrong_count", nullable = false)
    private Integer wrongCount = 1;

    /** 是否已掌握（用户手动标记） */
    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    /** 最近一次答错时间 */
    @Column(name = "last_wrong_at", nullable = false)
    private LocalDateTime lastWrongAt;

    /** 标记已掌握的时间 */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
