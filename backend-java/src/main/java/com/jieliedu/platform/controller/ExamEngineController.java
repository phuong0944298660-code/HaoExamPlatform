package com.jieliedu.platform.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Exam;
import com.jieliedu.platform.entity.StudentExamAssignment;
import com.jieliedu.platform.enums.AssignmentStatus;
import com.jieliedu.platform.enums.ExamStatus;
import com.jieliedu.platform.repository.ExamRepository;
import com.jieliedu.platform.repository.StudentExamAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import com.jieliedu.platform.entity.ExamPaper;
import com.jieliedu.platform.entity.PaperQuestion;
import com.jieliedu.platform.entity.Question;
import com.jieliedu.platform.repository.ExamPaperRepository;
import com.jieliedu.platform.repository.PaperQuestionRepository;
import com.jieliedu.platform.repository.QuestionRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 考试引擎控制器 - 学生答题
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/exam-engine")
@RequiredArgsConstructor
public class ExamEngineController {

    private final ExamRepository examRepository;
    private final StudentExamAssignmentRepository assignmentRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final ExamPaperRepository examPaperRepository;
    private final PaperQuestionRepository paperQuestionRepository;
    private final QuestionRepository questionRepository;

    /**
     * 开始考试
     */
    @PostMapping("/start")
    public Result<?> startExam(@RequestBody Map<String, Integer> request) {
        Integer examId = request.get("examId");
        Integer accountId = request.get("accountId");
        if (examId == null || accountId == null) {
            return Result.error("examId和accountId不能为空");
        }

        Exam exam = examRepository.findByIdAndIsDeletedFalse(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));

        if (exam.getStatus() != ExamStatus.PUBLISHED && exam.getStatus() != ExamStatus.IN_PROGRESS) {
            return Result.error("考试当前状态不允许作答");
        }

        // 查找已有分配或创建新的
        Optional<StudentExamAssignment> existing =
                assignmentRepository.findByExamIdAndAccountIdAndIsDeletedFalse(examId, accountId);

        if (existing.isPresent()) {
            StudentExamAssignment assignment = existing.get();
            if (assignment.getStatus() == AssignmentStatus.SUBMITTED
                    || assignment.getStatus() == AssignmentStatus.COMPLETED) {
                return Result.error("您已提交该考试，不能重复作答");
            }
            // 已存在且进行中，直接返回
            return Result.success(assignment);
        }

        // 创建新分配
        StudentExamAssignment assignment = new StudentExamAssignment();
        assignment.setExamId(examId);
        assignment.setAccountId(accountId);
        assignment.setAssignedPaperId(exam.getPaperId() != null ? exam.getPaperId() : 0);
        assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        assignment.setStartedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        return Result.success(assignment);
    }

    /**
     * 提交单题答案（保存到Redis）
     */
    @PostMapping("/submit-answer")
    public Result<?> submitAnswer(@RequestBody Map<String, Object> request) {
        Integer assignmentId = (Integer) request.get("assignmentId");
        Integer questionId = (Integer) request.get("questionId");
        Object answer = request.get("answer");

        if (assignmentId == null || questionId == null) {
            return Result.error("assignmentId和questionId不能为空");
        }

        StudentExamAssignment assignment = assignmentRepository.findByIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new RuntimeException("考试分配不存在"));

        if (assignment.getStatus() != AssignmentStatus.IN_PROGRESS) {
            return Result.error("当前状态不允许提交答案");
        }

        String redisKey = String.format("exam:%d:%d:progress", assignment.getExamId(), assignment.getAccountId());

        // 保存单题答案到Redis Hash
        redisTemplate.opsForHash().put(redisKey, questionId.toString(), answer);

        // 设置过期时间：考试结束后1小时
        Exam exam = examRepository.findByIdAndIsDeletedFalse(assignment.getExamId()).orElse(null);
        if (exam != null && exam.getEndTime() != null) {
            long secondsUntilExpiry = java.time.Duration.between(LocalDateTime.now(), exam.getEndTime()).getSeconds() + 3600;
            if (secondsUntilExpiry > 0) {
                redisTemplate.expire(redisKey, secondsUntilExpiry, TimeUnit.SECONDS);
            }
        }

        return Result.success("答案已保存");
    }

    /**
     * 最终提交考试
     */
    @PostMapping("/submit")
    public Result<?> submitExam(@RequestBody Map<String, Integer> request) {
        Integer assignmentId = request.get("assignmentId");
        if (assignmentId == null) {
            return Result.error("assignmentId不能为空");
        }

        StudentExamAssignment assignment = assignmentRepository.findByIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new RuntimeException("考试分配不存在"));

        if (assignment.getStatus() != AssignmentStatus.IN_PROGRESS) {
            return Result.error("当前状态不允许提交");
        }

        String redisKey = String.format("exam:%d:%d:progress", assignment.getExamId(), assignment.getAccountId());

        // 从Redis获取所有答案
        Map<Object, Object> redisAnswers = redisTemplate.opsForHash().entries(redisKey);
        Map<String, Object> answersMap = new HashMap<>();
        for (Map.Entry<Object, Object> entry : redisAnswers.entrySet()) {
            answersMap.put(entry.getKey().toString(), entry.getValue());
        }

        // 保存答案到MySQL
        try {
            assignment.setAnswers(objectMapper.writeValueAsString(answersMap));
        } catch (Exception e) {
            log.error("序列化答案失败", e);
            return Result.error("提交失败，请重试");
        }

        // 自动批改客观题
        BigDecimal objectiveScore = autoGradeObjective(assignment.getExamId(), answersMap);
        assignment.setObjectiveScore(objectiveScore);
        assignment.setStatus(AssignmentStatus.SUBMITTED);
        assignment.setSubmittedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // 清理Redis
        redisTemplate.delete(redisKey);

        return Result.success(assignment);
    }

    /**
     * 获取答题进度
     */
    @GetMapping("/progress/{assignmentId}")
    public Result<?> getProgress(@PathVariable Integer assignmentId) {
        StudentExamAssignment assignment = assignmentRepository.findByIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new RuntimeException("考试分配不存在"));

        String redisKey = String.format("exam:%d:%d:progress", assignment.getExamId(), assignment.getAccountId());
        Map<Object, Object> redisAnswers = redisTemplate.opsForHash().entries(redisKey);

        Map<String, Object> result = new HashMap<>();
        result.put("assignmentId", assignmentId);
        result.put("status", assignment.getStatus());
        result.put("startedAt", assignment.getStartedAt());
        result.put("answers", redisAnswers);
        return Result.success(result);
    }

    /**
     * 获取考试试卷快照
     */
    @GetMapping("/paper/{examId}")
    public Result<?> getPaperSnapshot(@PathVariable Integer examId) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));

        if (exam.getPaperSnapshot() == null || exam.getPaperSnapshot().isEmpty()) {
            return Result.error("该考试尚未生成试卷快照");
        }

        try {
            Object snapshot = objectMapper.readValue(exam.getPaperSnapshot(), Object.class);
            return Result.success(snapshot);
        } catch (Exception e) {
            log.error("解析试卷快照失败", e);
            return Result.error("试卷快照解析失败");
        }
    }

    /**
     * 获取考试题目（前端兼容路由）
     */
    @GetMapping("/exams/{examId}/questions")
    public Result<?> getExamQuestions(@PathVariable Integer examId, @CurrentUser UserPrincipal user) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(examId)
                .orElseThrow(() -> new RuntimeException("考试不存在"));

        // 自动创建分配
        Integer accountId = user.getId();
        Optional<StudentExamAssignment> existing =
                assignmentRepository.findByExamIdAndAccountIdAndIsDeletedFalse(examId, accountId);
        StudentExamAssignment assignment;
        if (existing.isPresent()) {
            assignment = existing.get();
        } else {
            assignment = new StudentExamAssignment();
            assignment.setExamId(examId);
            assignment.setAccountId(accountId);
            assignment.setAssignedPaperId(exam.getPaperId() != null ? exam.getPaperId() : 0);
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
            assignment.setStartedAt(LocalDateTime.now());
            assignmentRepository.save(assignment);
        }

        // 从试卷快照或数据库获取题目
        if (exam.getPaperSnapshot() != null && !exam.getPaperSnapshot().isEmpty()) {
            try {
                Object snapshot = objectMapper.readValue(exam.getPaperSnapshot(), Object.class);
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("assignment", assignment);
                result.put("paper", snapshot);
                return Result.success(result);
            } catch (Exception e) {
                log.error("解析试卷快照失败", e);
            }
        }

        // 从paper_questions + questions表获取
        Integer paperId = exam.getPaperId();
        if (paperId == null) {
            return Result.error("该考试未关联试卷");
        }

        List<PaperQuestion> paperQuestions = paperQuestionRepository.findByPaperIdAndIsDeletedFalse(paperId);
        paperQuestions.sort(Comparator.comparingInt(pq -> pq.getQuestionOrder() != null ? pq.getQuestionOrder() : 0));

        List<Integer> qIds = new ArrayList<>();
        for (PaperQuestion pq : paperQuestions) {
            qIds.add(pq.getQuestionId());
        }
        List<Question> questions = qIds.isEmpty() ? Collections.emptyList() : questionRepository.findByIdInAndIsDeletedFalse(qIds);
        Map<Integer, Question> questionMap = new LinkedHashMap<>();
        for (Question q : questions) {
            questionMap.put(q.getId(), q);
        }

        List<Map<String, Object>> questionList = new ArrayList<>();
        for (PaperQuestion pq : paperQuestions) {
            Question q = questionMap.get(pq.getQuestionId());
            if (q == null) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", q.getId());
            item.put("question_id", q.getId());
            String qTypeName = q.getQuestionType() != null ? q.getQuestionType().name() : null;
            item.put("questionType", qTypeName);
            // 前端兼容字段（snake_case lowercase）
            if (qTypeName != null) {
                item.put("question_type", qTypeName.toLowerCase());
            }
            item.put("content", q.getContent());
            // 解析options JSON字符串为对象
            Object optionsParsed = q.getOptions();
            if (optionsParsed instanceof String && ((String) optionsParsed).startsWith("[")) {
                try {
                    optionsParsed = objectMapper.readValue((String) optionsParsed, java.util.List.class);
                } catch (Exception ignored) {}
            }
            item.put("options", optionsParsed);
            item.put("score", pq.getScore());
            item.put("difficulty", q.getDifficulty() != null ? q.getDifficulty().name() : null);
            item.put("sortOrder", pq.getQuestionOrder());
            // 不返回答案给学生
            questionList.add(item);
        }

        ExamPaper paper = examPaperRepository.findByIdAndIsDeletedFalse(paperId).orElse(null);
        Map<String, Object> paperInfo = new LinkedHashMap<>();
        if (paper != null) {
            paperInfo.put("name", paper.getName());
            paperInfo.put("totalScore", paper.getTotalScore());
            paperInfo.put("durationMinutes", paper.getDurationMinutes());
        }
        paperInfo.put("questions", questionList);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assignment", assignment);
        result.put("paper", paperInfo);
        // 前端倒计时所需的考试截止时间
        result.put("endTime", exam.getEndTime());
        result.put("end_time", exam.getEndTime());
        result.put("examName", exam.getName());

        // 加载已有答案
        String redisKey = String.format("exam:%d:%d:progress", examId, accountId);
        Map<Object, Object> savedAnswers = redisTemplate.opsForHash().entries(redisKey);
        result.put("savedAnswers", savedAnswers);

        return Result.success(result);
    }

    /**
     * 保存答案（前端兼容路由）
     */
    @PostMapping("/exams/{examId}/answers")
    public Result<?> saveExamAnswer(@PathVariable Integer examId, @RequestBody Map<String, Object> request, @CurrentUser UserPrincipal user) {
        Integer accountId = user.getId();
        Integer questionId = request.get("question_id") != null ? ((Number) request.get("question_id")).intValue() : null;
        Object answer = request.get("answer");

        if (questionId == null) {
            return Result.error("question_id不能为空");
        }

        String redisKey = String.format("exam:%d:%d:progress", examId, accountId);
        redisTemplate.opsForHash().put(redisKey, questionId.toString(), answer);

        Exam exam = examRepository.findByIdAndIsDeletedFalse(examId).orElse(null);
        if (exam != null && exam.getEndTime() != null) {
            long secondsUntilExpiry = java.time.Duration.between(LocalDateTime.now(), exam.getEndTime()).getSeconds() + 3600;
            if (secondsUntilExpiry > 0) {
                redisTemplate.expire(redisKey, secondsUntilExpiry, TimeUnit.SECONDS);
            }
        }

        return Result.success("答案已保存");
    }

    /**
     * 获取答题进度（前端兼容路由）
     */
    @GetMapping("/exams/{examId}/progress")
    public Result<?> getExamProgress(@PathVariable Integer examId, @CurrentUser UserPrincipal user) {
        Integer accountId = user.getId();

        Optional<StudentExamAssignment> existing =
                assignmentRepository.findByExamIdAndAccountIdAndIsDeletedFalse(examId, accountId);

        String redisKey = String.format("exam:%d:%d:progress", examId, accountId);
        Map<Object, Object> redisAnswers = redisTemplate.opsForHash().entries(redisKey);

        Map<String, Object> result = new HashMap<>();
        result.put("examId", examId);
        result.put("answers", redisAnswers);
        existing.ifPresent(a -> {
            result.put("assignmentId", a.getId());
            result.put("status", a.getStatus());
            result.put("startedAt", a.getStartedAt());
        });

        return Result.success(result);
    }

    /**
     * 提交考试（前端兼容路由）
     */
    @PostMapping("/exams/{examId}/submit")
    public Result<?> submitExamByExamId(@PathVariable Integer examId, @RequestBody(required = false) Map<String, Object> request, @CurrentUser UserPrincipal user) {
        Integer accountId = user.getId();

        StudentExamAssignment assignment = assignmentRepository.findByExamIdAndAccountIdAndIsDeletedFalse(examId, accountId)
                .orElseThrow(() -> new RuntimeException("未找到考试分配记录"));

        if (assignment.getStatus() != AssignmentStatus.IN_PROGRESS) {
            return Result.error("当前状态不允许提交");
        }

        String redisKey = String.format("exam:%d:%d:progress", examId, accountId);
        Map<Object, Object> redisAnswers = redisTemplate.opsForHash().entries(redisKey);
        Map<String, Object> answersMap = new HashMap<>();
        for (Map.Entry<Object, Object> entry : redisAnswers.entrySet()) {
            answersMap.put(entry.getKey().toString(), entry.getValue());
        }

        try {
            assignment.setAnswers(objectMapper.writeValueAsString(answersMap));
        } catch (Exception e) {
            log.error("序列化答案失败", e);
            return Result.error("提交失败，请重试");
        }

        BigDecimal objectiveScore = autoGradeObjective(examId, answersMap);
        assignment.setObjectiveScore(objectiveScore);
        assignment.setStatus(AssignmentStatus.SUBMITTED);
        assignment.setSubmittedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        redisTemplate.delete(redisKey);

        return Result.success(assignment);
    }

    /**
     * 自动批改客观题
     */
    private BigDecimal autoGradeObjective(Integer examId, Map<String, Object> studentAnswers) {
        Exam exam = examRepository.findByIdAndIsDeletedFalse(examId).orElse(null);
        if (exam == null || exam.getPaperSnapshot() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalScore = BigDecimal.ZERO;

        try {
            Map<String, Object> snapshot = objectMapper.readValue(
                    exam.getPaperSnapshot(), new TypeReference<Map<String, Object>>() {});

            // 从快照中提取题目列表
            Object questionsObj = snapshot.get("questions");
            if (questionsObj == null) {
                questionsObj = snapshot.get("questionList");
            }
            if (!(questionsObj instanceof List)) {
                return BigDecimal.ZERO;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questions = (List<Map<String, Object>>) questionsObj;

            for (Map<String, Object> question : questions) {
                Object qIdObj = question.get("id");
                if (qIdObj == null) continue;
                String questionId = qIdObj.toString();

                String type = (String) question.get("questionType");
                if (type == null) {
                    type = (String) question.get("type");
                }
                if (type == null) continue;

                // 只批改客观题
                boolean isObjective = "SINGLE_CHOICE".equalsIgnoreCase(type)
                        || "single_choice".equals(type)
                        || "MULTIPLE_CHOICE".equalsIgnoreCase(type)
                        || "multiple_choice".equals(type)
                        || "MULTI_CHOICE".equalsIgnoreCase(type)
                        || "multi_choice".equals(type)
                        || "JUDGMENT".equalsIgnoreCase(type)
                        || "judgment".equals(type)
                        || "TRUE_FALSE".equalsIgnoreCase(type)
                        || "true_false".equals(type);

                if (!isObjective) continue;

                Object correctAnswerObj = question.get("correctAnswer");
                if (correctAnswerObj == null) {
                    correctAnswerObj = question.get("answer");
                }
                if (correctAnswerObj == null) continue;

                String correctAnswer = correctAnswerObj.toString().trim();
                Object studentAnswerObj = studentAnswers.get(questionId);
                if (studentAnswerObj == null) continue;

                String studentAnswer = studentAnswerObj.toString().trim();

                // 获取分值
                BigDecimal score = BigDecimal.ZERO;
                Object scoreObj = question.get("score");
                if (scoreObj instanceof Number) {
                    score = new BigDecimal(scoreObj.toString());
                }

                // 比较答案
                if (correctAnswer.equalsIgnoreCase(studentAnswer)) {
                    totalScore = totalScore.add(score);
                }
            }
        } catch (Exception e) {
            log.error("自动批改失败, examId={}", examId, e);
        }

        return totalScore;
    }
}
