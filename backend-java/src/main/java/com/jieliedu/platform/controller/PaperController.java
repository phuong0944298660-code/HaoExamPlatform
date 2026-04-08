package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.ExamPaper;
import com.jieliedu.platform.entity.PaperQuestion;
import com.jieliedu.platform.entity.Question;

import com.jieliedu.platform.repository.ExamPaperRepository;
import com.jieliedu.platform.repository.PaperQuestionRepository;
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

import java.util.*;
import java.util.stream.Collectors;

/**
 * 试卷管理控制器
 */
@RestController
@RequestMapping("/api/v1/papers")
@RequiredArgsConstructor
public class PaperController {

    private final ExamPaperRepository examPaperRepository;
    private final PaperQuestionRepository paperQuestionRepository;
    private final QuestionRepository questionRepository;

    /**
     * 试卷列表
     */
    @GetMapping
    public Result<?> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<ExamPaper> result = examPaperRepository.findByIsDeletedFalse(pageable);
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 试卷详情（含题目列表）
     */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Integer id) {
        ExamPaper paper = examPaperRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("试卷不存在"));

        List<PaperQuestion> paperQuestions = paperQuestionRepository.findByPaperIdAndIsDeletedFalse(id);
        paperQuestions.sort(Comparator.comparingInt(PaperQuestion::getQuestionOrder));

        // 获取关联的题目详情
        List<Integer> questionIds = paperQuestions.stream()
                .map(PaperQuestion::getQuestionId)
                .collect(Collectors.toList());
        List<Question> questions = questionIds.isEmpty()
                ? Collections.emptyList()
                : questionRepository.findByIdInAndIsDeletedFalse(questionIds);
        Map<Integer, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        // 组装返回数据
        List<Map<String, Object>> questionList = new ArrayList<>();
        for (PaperQuestion pq : paperQuestions) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("paperQuestionId", pq.getId());
            item.put("questionId", pq.getQuestionId());
            item.put("sortOrder", pq.getQuestionOrder());
            item.put("score", pq.getScore());
            Question q = questionMap.get(pq.getQuestionId());
            if (q != null) {
                item.put("content", q.getContent());
                item.put("questionType", q.getQuestionType());
                item.put("options", q.getOptions());
                item.put("correctAnswer", q.getCorrectAnswer());
                item.put("difficulty", q.getDifficulty());
                item.put("analysis", q.getAnalysis());
            }
            questionList.add(item);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("paper", paper);
        data.put("questions", questionList);
        return Result.success(data);
    }

    /**
     * 创建试卷
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> create(@RequestBody ExamPaper request, @CurrentUser UserPrincipal user) {
        ExamPaper paper = new ExamPaper();
        paper.setName(request.getName());
        paper.setDescription(request.getDescription());
        paper.setGradeGroup(request.getGradeGroup());
        paper.setTotalScore(request.getTotalScore());
        paper.setDurationMinutes(request.getDurationMinutes());
        paper.setDuration(request.getDuration());
        paper.setQuestionBankId(request.getQuestionBankId());
        paper.setQuestionCount(0);
        paper.setStatus("DRAFT");
        paper.setCreatedBy(user.getId());
        examPaperRepository.save(paper);
        return Result.success(paper);
    }

    /**
     * 更新试卷
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> update(@PathVariable Integer id, @RequestBody ExamPaper request) {
        ExamPaper paper = examPaperRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("试卷不存在"));
        if (request.getName() != null) paper.setName(request.getName());
        if (request.getDescription() != null) paper.setDescription(request.getDescription());
        if (request.getGradeGroup() != null) paper.setGradeGroup(request.getGradeGroup());
        if (request.getTotalScore() != null) paper.setTotalScore(request.getTotalScore());
        if (request.getDurationMinutes() != null) paper.setDurationMinutes(request.getDurationMinutes());
        if (request.getDuration() != null) paper.setDuration(request.getDuration());
        if (request.getQuestionBankId() != null) paper.setQuestionBankId(request.getQuestionBankId());
        examPaperRepository.save(paper);
        return Result.success(paper);
    }

    /**
     * 添加题目到试卷
     */
    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> addQuestions(@PathVariable Integer id, @RequestBody List<Map<String, Object>> questionItems) {
        ExamPaper paper = examPaperRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("试卷不存在"));

        List<PaperQuestion> saved = new ArrayList<>();
        for (Map<String, Object> item : questionItems) {
            PaperQuestion pq = new PaperQuestion();
            pq.setPaperId(id);
            pq.setQuestionId((Integer) item.get("questionId"));
            pq.setQuestionOrder(item.containsKey("sortOrder") ? (Integer) item.get("sortOrder") : saved.size() + 1);
            if (item.containsKey("score") && item.get("score") != null) {
                pq.setScore(new java.math.BigDecimal(item.get("score").toString()));
            }
            saved.add(paperQuestionRepository.save(pq));
        }

        paper.setQuestionCount(paperQuestionRepository.findByPaperIdAndIsDeletedFalse(id).size());
        examPaperRepository.save(paper);
        return Result.success(saved);
    }

    /**
     * 发布试卷
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> publish(@PathVariable Integer id) {
        ExamPaper paper = examPaperRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("试卷不存在"));

        // 检查是否有题目
        List<PaperQuestion> questions = paperQuestionRepository.findByPaperIdAndIsDeletedFalse(id);
        if (questions.isEmpty()) {
            return Result.error("试卷没有题目，无法发布");
        }

        paper.setStatus("PUBLISHED");
        paper.setQuestionCount(questions.size());
        examPaperRepository.save(paper);
        return Result.success(paper);
    }

    /**
     * 删除试卷（软删除）
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> delete(@PathVariable Integer id) {
        ExamPaper paper = examPaperRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("试卷不存在"));
        paper.setIsDeleted(true);
        examPaperRepository.save(paper);
        return Result.success("删除成功");
    }
}
