package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.service.GradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 评分控制器
 */
@RestController
@RequestMapping("/grading")
@RequiredArgsConstructor
public class GradingController {

    private final GradingService gradingService;

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public Result<?> getPendingTasks() {
        return Result.success(gradingService.getPendingTasks());
    }
}
