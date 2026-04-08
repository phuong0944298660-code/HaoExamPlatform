package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.enums.QuestionDifficulty;
import com.jieliedu.platform.enums.QuestionType;
import com.jieliedu.platform.enums.StatusEnum;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

/**
 * 题目实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "questions")
public class Question extends BaseEntity {
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group", nullable = false)
    private GradeGroup gradeGroup;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "difficulty", nullable = false)
    private QuestionDifficulty difficulty;
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "options", columnDefinition = "TEXT")
    private String options;
    
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;
    
    @Column(name = "analysis", columnDefinition = "TEXT")
    private String analysis;

    /** 解析图片URL数组，JSON格式: ["url1","url2"] */
    @Column(name = "analysis_images", columnDefinition = "JSON")
    private String analysisImages;
    
    @Column(name = "score", precision = 10, scale = 2)
    private BigDecimal score;
    
    @Column(name = "knowledge_points")
    private String knowledgePoints;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false)
    private StatusEnum status = StatusEnum.ENABLED;
    
    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "question_bank_id")
    private Integer questionBankId;

    @Column(name = "default_score")
    private Float defaultScore;
}
