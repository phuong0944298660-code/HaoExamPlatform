package com.jieliedu.platform.entity;

import com.jieliedu.platform.enums.ExamStatus;
import com.jieliedu.platform.enums.ExamType;
import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * 考试实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "exams")
public class Exam extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "exam_type")
    private ExamType examType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "grade_group")
    private GradeGroup gradeGroup;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false)
    private ExamStatus status = ExamStatus.DRAFT;

    @Column(name = "paper_id")
    private Integer paperId;

    @Column(name = "paper_ids", columnDefinition = "TEXT")
    private String paperIds;

    @Column(name = "paper_snapshot", columnDefinition = "TEXT")
    private String paperSnapshot;

    @Column(name = "paper_snapshot_version")
    private Integer paperSnapshotVersion;

    @Column(name = "paper_snapshot_hash")
    private String paperSnapshotHash;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "allow_late_submission")
    private Boolean allowLateSubmission = false;

    @Column(name = "show_result")
    private Boolean showResult = true;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Column(name = "enrolled_count")
    private Integer enrolledCount;

    @Column(name = "participant_count")
    private Integer participantCount;

    @Column(name = "total_submissions")
    private Integer totalSubmissions;

    @Column(name = "submitted_count")
    private Integer submittedCount;

    @Column(name = "student_list", columnDefinition = "TEXT")
    private String studentList;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "published_by")
    private Integer publishedBy;

    @Column(name = "allow_ip_check")
    private Boolean allowIpCheck;

    @Column(name = "allowed_ips", columnDefinition = "TEXT")
    private String allowedIps;

    @Column(name = "max_login_devices")
    private Integer maxLoginDevices;

    @Column(name = "is_emergency_extended")
    private Boolean isEmergencyExtended;

    @Column(name = "extended_minutes")
    private Integer extendedMinutes;

    @Column(name = "extended_by")
    private Integer extendedBy;

    @Column(name = "extended_at")
    private LocalDateTime extendedAt;

    @Column(name = "extended_reason")
    private String extendedReason;

    @Column(name = "is_score_query_open")
    private Boolean isScoreQueryOpen = false;

    @Column(name = "score_query_start_time")
    private LocalDateTime scoreQueryStartTime;

    @Column(name = "score_query_end_time")
    private LocalDateTime scoreQueryEndTime;

    @Column(name = "max_screen_switches")
    private Integer maxScreenSwitches = 0;
}
