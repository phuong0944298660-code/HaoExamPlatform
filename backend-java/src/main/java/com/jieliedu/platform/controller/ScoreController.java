package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.StudentExamAssignment;
import com.jieliedu.platform.repository.StudentExamAssignmentRepository;
import com.jieliedu.platform.security.UserPrincipal;
import com.jieliedu.platform.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 成绩管理控制器
 */
@RestController
@RequestMapping("/api/v1/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final StudentExamAssignmentRepository assignmentRepository;

    /**
     * 成绩列表（按exam_id筛选）
     */
    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) Integer examId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<StudentExamAssignment> result;
        if (examId != null) {
            result = assignmentRepository.findByExamIdAndIsDeletedFalse(examId, pageable);
        } else {
            result = assignmentRepository.findByIsDeletedFalse(pageable);
        }
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 学生查询本人考试成绩
     */
    @GetMapping("/my-result")
    public Result<?> myResult(@RequestParam(name = "exam_id") Integer examId,
                              @CurrentUser UserPrincipal user) {
        Integer accountId = user.getId();
        StudentExamAssignment assignment = assignmentRepository
                .findByExamIdAndAccountIdAndIsDeletedFalse(examId, accountId)
                .orElse(null);

        if (assignment == null) {
            return Result.error("未找到您的考试记录");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("exam_name", "");
        result.put("total_score", assignment.getTotalScore());
        result.put("objective_score", assignment.getObjectiveScore());
        result.put("subjective_score", assignment.getSubjectiveScore());
        result.put("submitted_at", assignment.getSubmittedAt());
        result.put("status", assignment.getStatus() != null ? assignment.getStatus().name().toLowerCase() : null);
        result.put("rank", null);
        result.put("grading_sheets", java.util.Collections.emptyList());
        return Result.success(result);
    }

    /**
     * 成绩详情
     */
    @GetMapping("/{assignmentId}")
    public Result<?> detail(@PathVariable Integer assignmentId) {
        StudentExamAssignment assignment = assignmentRepository.findByIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new RuntimeException("成绩记录不存在"));
        return Result.success(assignment);
    }
}
