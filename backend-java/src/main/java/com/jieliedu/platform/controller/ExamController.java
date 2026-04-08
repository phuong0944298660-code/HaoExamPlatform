package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Exam;
import com.jieliedu.platform.enums.ExamStatus;
import com.jieliedu.platform.repository.ExamPaperRepository;
import com.jieliedu.platform.repository.ExamRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 考试管理控制器
 */
@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamRepository examRepository;
    private final ExamPaperRepository examPaperRepository;

    /**
     * 考试列表
     */
    @GetMapping
    public Result<?> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Exam> result = examRepository.findByIsDeletedFalse(pageable);
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 考试详情
     */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Integer id) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        return Result.success(exam);
    }

    /**
     * 创建考试
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> create(@RequestBody Exam request, @CurrentUser UserPrincipal user) {
        // 验证试卷存在
        if (request.getPaperId() != null) {
            examPaperRepository.findByIdAndIsDeletedFalse(request.getPaperId())
                    .orElseThrow(() -> new RuntimeException("关联的试卷不存在"));
        }

        Exam exam = new Exam();
        exam.setName(request.getName());
        exam.setDescription(request.getDescription());
        exam.setExamType(request.getExamType());
        exam.setGradeGroup(request.getGradeGroup());
        exam.setPaperId(request.getPaperId());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        exam.setDuration(request.getDuration() != null ? request.getDuration() : request.getDurationMinutes());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setAllowLateSubmission(request.getAllowLateSubmission());
        exam.setShowResult(request.getShowResult());
        exam.setMaxScreenSwitches(request.getMaxScreenSwitches() != null ? request.getMaxScreenSwitches() : 0);
        exam.setStatus(ExamStatus.DRAFT);
        exam.setCreatedBy(user.getId());
        examRepository.save(exam);
        return Result.success(exam);
    }

    /**
     * 更新考试
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> update(@PathVariable Integer id, @RequestBody Exam request) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("考试不存在"));

        if (exam.getStatus() != ExamStatus.DRAFT) {
            return Result.error("只有草稿状态的考试可以编辑");
        }

        if (request.getName() != null) exam.setName(request.getName());
        if (request.getDescription() != null) exam.setDescription(request.getDescription());
        if (request.getExamType() != null) exam.setExamType(request.getExamType());
        if (request.getGradeGroup() != null) exam.setGradeGroup(request.getGradeGroup());
        if (request.getPaperId() != null) {
            examPaperRepository.findByIdAndIsDeletedFalse(request.getPaperId())
                    .orElseThrow(() -> new RuntimeException("关联的试卷不存在"));
            exam.setPaperId(request.getPaperId());
        }
        if (request.getStartTime() != null) exam.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) exam.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) exam.setDurationMinutes(request.getDurationMinutes());
        if (request.getAllowLateSubmission() != null) exam.setAllowLateSubmission(request.getAllowLateSubmission());
        if (request.getShowResult() != null) exam.setShowResult(request.getShowResult());
        if (request.getMaxScreenSwitches() != null) exam.setMaxScreenSwitches(request.getMaxScreenSwitches());
        examRepository.save(exam);
        return Result.success(exam);
    }

    /**
     * 发布考试
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> publish(@PathVariable Integer id) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("考试不存在"));

        if (exam.getStatus() != ExamStatus.DRAFT) {
            return Result.error("只有草稿状态的考试可以发布");
        }
        if (exam.getPaperId() == null) {
            return Result.error("考试未关联试卷，无法发布");
        }

        exam.setStatus(ExamStatus.PUBLISHED);
        examRepository.save(exam);
        return Result.success(exam);
    }

    /**
     * 删除考试（软删除）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> delete(@PathVariable Integer id) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("考试不存在"));
        if (exam.getStatus() != ExamStatus.DRAFT) {
            return Result.error("只有草稿状态的考试可以删除");
        }
        exam.setIsDeleted(true);
        examRepository.save(exam);
        return Result.success("删除成功");
    }
}
