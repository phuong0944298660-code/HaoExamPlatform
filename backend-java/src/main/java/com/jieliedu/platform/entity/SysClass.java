package com.jieliedu.platform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;

/**
 * 班级实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "sys_classes")
public class SysClass extends BaseEntity {
    
    @Column(name = "class_name", nullable = false)
    @JsonProperty("class_name")
    private String className;
    
    @Column(name = "grade")
    private String grade;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "grade_group")
    @JsonProperty("grade_group")
    private GradeGroup gradeGroup;
    
    @Column(name = "school_name")
    @JsonProperty("school_name")
    private String schoolName;
    
    @Column(name = "teacher_id")
    @JsonProperty("teacher_id")
    private Integer teacherId;
    
    @Column(name = "student_count")
    @JsonProperty("student_count")
    private Integer studentCount = 0;
    
    @Column(name = "description")
    private String description;
}
