package com.jieliedu.platform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 活动反馈实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "event_feedbacks")
public class EventFeedback extends BaseEntity {

    @Column(name = "exam_id")
    private Integer examId;

    @Column(name = "reporter_id")
    private Integer reporterId;

    @Column(name = "reporter_name", nullable = false)
    private String reporterName;

    @Column(name = "reporter_contact")
    private String reporterContact;

    @Column(name = "reporter_role")
    private String reporterRole;

    @Column(name = "category")
    private String category;

    @Column(name = "priority")
    private String priority;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "screenshots", columnDefinition = "JSON")
    private String screenshots;

    @Column(name = "status")
    private String status;

    @Column(name = "assigned_to")
    private Integer assignedTo;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "feedback_type")
    private String feedbackType;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "submitted_by")
    private Integer submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}
