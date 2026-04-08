package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Question;
import com.jieliedu.platform.enums.QuestionDifficulty;
import com.jieliedu.platform.enums.QuestionType;
import com.jieliedu.platform.enums.StatusEnum;
import com.jieliedu.platform.repository.QuestionRepository;
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
 * 题目管理控制器
 */
@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;

    /**
     * 题目列表（支持question_bank_id, question_type, difficulty筛选，分页）
     */
    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) Integer questionBankId,
            @RequestParam(required = false) QuestionType questionType,
            @RequestParam(required = false) QuestionDifficulty difficulty,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Question> result;

        if (questionBankId != null && questionType != null && difficulty != null) {
            result = questionRepository.findByQuestionBankIdAndQuestionTypeAndDifficultyAndIsDeletedFalse(
                    questionBankId, questionType, difficulty, pageable);
        } else if (questionBankId != null && questionType != null) {
            result = questionRepository.findByQuestionBankIdAndQuestionTypeAndIsDeletedFalse(
                    questionBankId, questionType, pageable);
        } else if (questionBankId != null && difficulty != null) {
            result = questionRepository.findByQuestionBankIdAndDifficultyAndIsDeletedFalse(
                    questionBankId, difficulty, pageable);
        } else if (questionBankId != null) {
            result = questionRepository.findByQuestionBankIdAndIsDeletedFalse(questionBankId, pageable);
        } else if (questionType != null && difficulty != null) {
            result = questionRepository.findByQuestionTypeAndDifficultyAndIsDeletedFalse(
                    questionType, difficulty, pageable);
        } else if (questionType != null) {
            result = questionRepository.findByQuestionTypeAndIsDeletedFalse(questionType, pageable);
        } else if (difficulty != null) {
            result = questionRepository.findByDifficultyAndIsDeletedFalse(difficulty, pageable);
        } else {
            result = questionRepository.findByIsDeletedFalse(pageable);
        }

        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 题目详情
     */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Integer id) {
        Question question = questionRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("题目不存在"));
        return Result.success(question);
    }

    /**
     * 创建题目
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> create(@RequestBody Question request, @CurrentUser UserPrincipal user) {
        Question question = new Question();
        question.setContent(request.getContent());
        question.setQuestionType(request.getQuestionType());
        question.setGradeGroup(request.getGradeGroup());
        question.setDifficulty(request.getDifficulty());
        question.setOptions(request.getOptions());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setAnalysis(request.getAnalysis());
        question.setAnalysisImages(request.getAnalysisImages());
        question.setScore(request.getScore());
        question.setDefaultScore(request.getDefaultScore());
        question.setKnowledgePoints(request.getKnowledgePoints());
        question.setQuestionBankId(request.getQuestionBankId());
        question.setStatus(StatusEnum.ENABLED);
        question.setCreatedBy(user.getId());
        questionRepository.save(question);
        return Result.success(question);
    }

    /**
     * 批量导入题目
     */
    @PostMapping("/batch-create")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> batchCreate(@RequestBody java.util.List<Question> questions, @CurrentUser UserPrincipal user) {
        for (Question q : questions) {
            q.setStatus(StatusEnum.ENABLED);
            q.setCreatedBy(user.getId());
            if (q.getIsDeleted() == null) q.setIsDeleted(false);
        }
        questionRepository.saveAll(questions);
        return Result.success("成功导入 " + questions.size() + " 道题目");
    }

    /**
     * 更新题目
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> update(@PathVariable Integer id, @RequestBody Question request) {
        Question question = questionRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("题目不存在"));
        if (request.getContent() != null) question.setContent(request.getContent());
        if (request.getQuestionType() != null) question.setQuestionType(request.getQuestionType());
        if (request.getGradeGroup() != null) question.setGradeGroup(request.getGradeGroup());
        if (request.getDifficulty() != null) question.setDifficulty(request.getDifficulty());
        if (request.getOptions() != null) question.setOptions(request.getOptions());
        if (request.getCorrectAnswer() != null) question.setCorrectAnswer(request.getCorrectAnswer());
        if (request.getAnalysis() != null) question.setAnalysis(request.getAnalysis());
        if (request.getAnalysisImages() != null) question.setAnalysisImages(request.getAnalysisImages());
        if (request.getScore() != null) question.setScore(request.getScore());
        if (request.getDefaultScore() != null) question.setDefaultScore(request.getDefaultScore());
        if (request.getKnowledgePoints() != null) question.setKnowledgePoints(request.getKnowledgePoints());
        if (request.getStatus() != null) question.setStatus(request.getStatus());
        questionRepository.save(question);
        return Result.success(question);
    }

    /**
     * 删除题目（软删除）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> delete(@PathVariable Integer id) {
        Question question = questionRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("题目不存在"));
        question.setIsDeleted(true);
        questionRepository.save(question);
        return Result.success("删除成功");
    }
}
