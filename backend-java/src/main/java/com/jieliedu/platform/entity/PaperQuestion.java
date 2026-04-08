package com.jieliedu.platform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * 试卷题目关联实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "paper_questions")
public class PaperQuestion extends BaseEntity {

    @Column(name = "paper_id", nullable = false)
    private Integer paperId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Column(name = "sort_order")
    private Integer questionOrder;

    @Column(name = "score")
    private BigDecimal score;
}
