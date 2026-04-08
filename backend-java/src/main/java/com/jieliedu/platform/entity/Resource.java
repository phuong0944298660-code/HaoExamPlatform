package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 资源实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "resources")
public class Resource extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "category")
    private String category;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group")
    private GradeGroup gradeGroup;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "status")
    private String status;
}
