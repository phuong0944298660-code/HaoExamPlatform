package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.EventFeedback;
import com.jieliedu.platform.repository.EventFeedbackRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * 活动反馈控制器
 */
@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final EventFeedbackRepository feedbackRepository;

    /**
     * 反馈列表（分页）
     */
    @GetMapping
    public Result<?> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<EventFeedback> result = feedbackRepository.findByIsDeletedFalse(pageable);
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 提交反馈
     */
    @PostMapping
    public Result<?> create(@RequestBody EventFeedback request, @CurrentUser UserPrincipal user) {
        EventFeedback feedback = new EventFeedback();
        feedback.setEventName(request.getEventName());
        feedback.setFeedbackType(request.getFeedbackType());
        feedback.setContent(request.getContent());
        feedback.setRating(request.getRating());
        feedback.setSubmittedBy(user.getId());
        feedback.setSubmittedAt(LocalDateTime.now());
        feedback.setReporterName(request.getReporterName() != null ? request.getReporterName() : "匿名用户");
        feedback.setTitle(request.getTitle() != null ? request.getTitle() : request.getEventName());
        feedback.setDescription(request.getDescription() != null ? request.getDescription() : (request.getContent() != null ? request.getContent() : "无描述"));
        feedbackRepository.save(feedback);
        return Result.success(feedback);
    }

    /**
     * 反馈详情
     */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Integer id) {
        EventFeedback feedback = feedbackRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("反馈不存在"));
        return Result.success(feedback);
    }

    /**
     * 删除反馈（软删除，仅管理员）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> delete(@PathVariable Integer id) {
        EventFeedback feedback = feedbackRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("反馈不存在"));
        feedback.setIsDeleted(true);
        feedbackRepository.save(feedback);
        return Result.success("删除成功");
    }
}
