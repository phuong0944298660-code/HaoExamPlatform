package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.QuestionBank;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.QuestionBankRepository;
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
 * 题库管理控制器
 */
@RestController
@RequestMapping("/api/v1/question-banks")
@RequiredArgsConstructor
public class QuestionBankController {

    private final QuestionBankRepository questionBankRepository;

    /**
     * 题库列表（支持grade_group筛选，分页）
     */
    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) GradeGroup gradeGroup,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<QuestionBank> result;
        // 如果学段是 ALL 或者 null，查询全部
        if (gradeGroup != null && gradeGroup != GradeGroup.ALL) {
            result = questionBankRepository.findByGradeGroupAndIsDeletedFalse(gradeGroup, pageable);
        } else {
            result = questionBankRepository.findByIsDeletedFalse(pageable);
        }
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 题库详情
     */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Integer id) {
        QuestionBank bank = questionBankRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("题库不存在"));
        return Result.success(bank);
    }

    /**
     * 创建题库
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> create(@RequestBody QuestionBank request, @CurrentUser UserPrincipal user) {
        QuestionBank bank = new QuestionBank();
        bank.setName(request.getName());
        bank.setDescription(request.getDescription());
        bank.setSubject(request.getSubject());
        bank.setGradeGroup(request.getGradeGroup());
        bank.setCreatedBy(user.getId());
        bank.setQuestionCount(0);
        bank.setTotalQuestions(0);
        questionBankRepository.save(bank);
        return Result.success(bank);
    }

    /**
     * 更新题库
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> update(@PathVariable Integer id, @RequestBody QuestionBank request) {
        QuestionBank bank = questionBankRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("题库不存在"));
        if (request.getName() != null) bank.setName(request.getName());
        if (request.getDescription() != null) bank.setDescription(request.getDescription());
        if (request.getSubject() != null) bank.setSubject(request.getSubject());
        if (request.getGradeGroup() != null) bank.setGradeGroup(request.getGradeGroup());
        if (request.getStatus() != null) bank.setStatus(request.getStatus());
        questionBankRepository.save(bank);
        return Result.success(bank);
    }

    /**
     * 删除题库（软删除）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> delete(@PathVariable Integer id) {
        QuestionBank bank = questionBankRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("题库不存在"));
        bank.setIsDeleted(true);
        questionBankRepository.save(bank);
        return Result.success("删除成功");
    }
}
