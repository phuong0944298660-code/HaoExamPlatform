package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.exception.BusinessException;
import com.jieliedu.platform.security.UserPrincipal;
import com.jieliedu.platform.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 练习功能控制器
 * 仅 PRACTICE 类型账号可访问
 */
@RestController
@RequestMapping("/api/v1/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;

    /**
     * 获取可访问的题库列表
     * GET /api/v1/practice/banks
     */
    @GetMapping("/banks")
    public Result<?> getBanks(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Map<String, Object>> banks = practiceService.getAccessibleBanks(currentUser.getId());
        return Result.success(banks);
    }

    /**
     * 获取题库题目列表（不含答案）
     * GET /api/v1/practice/banks/{bankId}/questions
     */
    @GetMapping("/banks/{bankId}/questions")
    public Result<?> getBankQuestions(
            @PathVariable Integer bankId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Map<String, Object>> questions = practiceService.getBankQuestions(currentUser.getId(), bankId);
        return Result.success(questions);
    }

    /**
     * 提交答案，立即返回判题结果
     * POST /api/v1/practice/answer
     * Body: { "questionId": 1, "bankId": 1, "answer": "A" }
     */
    @PostMapping("/answer")
    public Result<?> submitAnswer(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Integer questionId = getIntFromMap(body, "questionId");
        Integer bankId = getIntFromMap(body, "bankId");
        String answer = (String) body.get("answer");

        if (questionId == null || bankId == null) {
            throw new BusinessException("questionId 和 bankId 不能为空");
        }
        if (answer == null || answer.isBlank()) {
            throw new BusinessException("答案不能为空");
        }

        Map<String, Object> result = practiceService.submitAnswer(
                currentUser.getId(), questionId, bankId, answer.trim());
        return Result.success(result);
    }

    /**
     * 获取错题本
     * GET /api/v1/practice/wrong-answers?questionBankId=1
     */
    @GetMapping("/wrong-answers")
    public Result<?> getWrongAnswers(
            @RequestParam(required = false) Integer questionBankId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Map<String, Object>> items = practiceService.getWrongAnswers(currentUser.getId(), questionBankId);
        return Result.success(items);
    }

    /**
     * 标记错题为已掌握
     * PUT /api/v1/practice/wrong-answers/{questionId}/resolve
     */
    @PutMapping("/wrong-answers/{questionId}/resolve")
    public Result<?> resolveWrongAnswer(
            @PathVariable Integer questionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        practiceService.resolveWrongAnswer(currentUser.getId(), questionId);
        return Result.success("已标记为掌握");
    }

    /**
     * 从错题本删除
     * DELETE /api/v1/practice/wrong-answers/{questionId}
     */
    @DeleteMapping("/wrong-answers/{questionId}")
    public Result<?> deleteWrongAnswer(
            @PathVariable Integer questionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        practiceService.deleteWrongAnswer(currentUser.getId(), questionId);
        return Result.success("已从错题本删除");
    }

    /**
     * 获取练习统计数据
     * GET /api/v1/practice/stats
     */
    @GetMapping("/stats")
    public Result<?> getStats(@AuthenticationPrincipal UserPrincipal currentUser) {
        Map<String, Object> stats = practiceService.getStats(currentUser.getId());
        return Result.success(stats);
    }

    // ────────────────────────────────────────────
    // 辅助方法
    // ────────────────────────────────────────────

    private Integer getIntFromMap(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Number) return ((Number) val).intValue();
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
