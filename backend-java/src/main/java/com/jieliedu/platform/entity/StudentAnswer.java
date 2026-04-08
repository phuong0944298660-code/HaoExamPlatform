package com.jieliedu.platform.entity;

import lombok.Data;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * 学生答题记录实体
 */
@Data
@Entity
@Table(name = "student_answers")
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false)
    private Long examId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Column(name = "question_order")
    private Integer questionOrder;

    @Column(name = "paper_id")
    private Long paperId;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "score", precision = 10, scale = 2)
    private BigDecimal score;

    @Column(name = "full_score", precision = 10, scale = 2)
    private BigDecimal fullScore;
}
