package com.jieliedu.platform.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jieliedu.platform.entity.*;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.exception.BusinessException;
import com.jieliedu.platform.repository.*;
import com.jieliedu.platform.service.PracticeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 练习功能服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeServiceImpl implements PracticeService {

    private final AccountRepository accountRepository;
    private final ActivationCodeRepository activationCodeRepository;
    private final ActivationPlanRepository activationPlanRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;
    private final PracticeRecordRepository practiceRecordRepository;
    private final WrongAnswerBookRepository wrongAnswerBookRepository;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────
    // 1. 获取可访问的题库列表
    // ─────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> getAccessibleBanks(Integer accountId) {
        Account account = getVerifiedPracticeAccount(accountId);

        List<Integer> bankIds = resolveAccessibleBankIds(account);
        if (bankIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Integer bankId : bankIds) {
            questionBankRepository.findById(bankId).ifPresent(bank -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", bank.getId());
                item.put("name", bank.getName());
                item.put("description", bank.getDescription());
                item.put("subject", bank.getSubject());
                item.put("gradeGroup", bank.getGradeGroup());
                item.put("questionCount", bank.getQuestionCount() != null ? bank.getQuestionCount() : 0);

                // 练习进度
                long practicedCount = practiceRecordRepository
                        .countByAccountIdAndQuestionBankIdAndIsDeletedFalse(accountId, bankId);
                long correctCount = practiceRecordRepository
                        .countByAccountIdAndQuestionBankIdAndIsCorrectTrueAndIsDeletedFalse(accountId, bankId);
                long wrongCount = wrongAnswerBookRepository
                        .countByAccountIdAndQuestionBankIdAndIsResolvedFalseAndIsDeletedFalse(accountId, bankId);

                int total = bank.getQuestionCount() != null ? bank.getQuestionCount() : 0;
                double accuracy = practicedCount > 0 ? (double) correctCount / practicedCount * 100 : 0;

                item.put("practicedCount", practicedCount);
                item.put("correctCount", correctCount);
                item.put("wrongCount", wrongCount);
                item.put("accuracy", Math.round(accuracy * 10.0) / 10.0);
                item.put("progress", total > 0 ? Math.min(100, (int) (practicedCount * 100 / total)) : 0);
                result.add(item);
            });
        }
        return result;
    }

    // ─────────────────────────────────────────────
    // 2. 获取题库题目（不含答案）
    // ─────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> getBankQuestions(Integer accountId, Integer questionBankId) {
        getVerifiedPracticeAccount(accountId);
        verifyBankAccess(accountId, questionBankId);

        List<Question> questions = questionRepository.findByQuestionBankIdAndIsDeletedFalse(questionBankId);

        // 查询已答过的题目ID
        List<Integer> practicedIds = practiceRecordRepository
                .findPracticedQuestionIdsByAccountIdAndBankId(accountId, questionBankId);
        Set<Integer> practicedSet = new HashSet<>(practicedIds);

        // 查询错题本
        List<WrongAnswerBook> wrongBooks = wrongAnswerBookRepository
                .findByAccountIdAndQuestionBankIdAndIsDeletedFalseOrderByLastWrongAtDesc(accountId, questionBankId);
        Map<Integer, WrongAnswerBook> wrongMap = wrongBooks.stream()
                .collect(Collectors.toMap(WrongAnswerBook::getQuestionId, w -> w));

        return questions.stream().map(q -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", q.getId());
            item.put("questionType", q.getQuestionType());
            item.put("gradeGroup", q.getGradeGroup());
            item.put("difficulty", q.getDifficulty());
            item.put("content", q.getContent());
            item.put("options", q.getOptions());
            item.put("score", q.getScore());
            item.put("knowledgePoints", q.getKnowledgePoints());
            // 不返回 correctAnswer / analysis，答题后再返回
            item.put("practiced", practicedSet.contains(q.getId()));
            WrongAnswerBook wb = wrongMap.get(q.getId());
            item.put("inWrongBook", wb != null && !wb.getIsResolved());
            return item;
        }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // 3. 提交答案
    // ─────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> submitAnswer(Integer accountId, Integer questionId,
                                            Integer questionBankId, String studentAnswer) {
        getVerifiedPracticeAccount(accountId);
        verifyBankAccess(accountId, questionBankId);

        Question question = questionRepository.findByIdAndIsDeletedFalse(questionId)
                .orElseThrow(() -> new BusinessException("题目不存在"));

        boolean isCorrect = judgeAnswer(question, studentAnswer);

        // 记录练习记录
        PracticeRecord record = new PracticeRecord();
        record.setAccountId(accountId);
        record.setQuestionId(questionId);
        record.setQuestionBankId(questionBankId);
        record.setStudentAnswer(studentAnswer);
        record.setIsCorrect(isCorrect);
        record.setPracticeAt(LocalDateTime.now());
        practiceRecordRepository.save(record);

        // 更新错题本
        if (!isCorrect) {
            Optional<WrongAnswerBook> existing = wrongAnswerBookRepository
                    .findByAccountIdAndQuestionIdAndIsDeletedFalse(accountId, questionId);
            if (existing.isPresent()) {
                WrongAnswerBook wb = existing.get();
                wb.setWrongCount(wb.getWrongCount() + 1);
                wb.setLastWrongAt(LocalDateTime.now());
                // 如果之前标记为已掌握但又答错了，重置状态
                if (wb.getIsResolved()) {
                    wb.setIsResolved(false);
                    wb.setResolvedAt(null);
                }
                wrongAnswerBookRepository.save(wb);
            } else {
                WrongAnswerBook wb = new WrongAnswerBook();
                wb.setAccountId(accountId);
                wb.setQuestionId(questionId);
                wb.setQuestionBankId(questionBankId);
                wb.setWrongCount(1);
                wb.setIsResolved(false);
                wb.setLastWrongAt(LocalDateTime.now());
                wrongAnswerBookRepository.save(wb);
            }
        }

        // 构建响应（含答案+解析）
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("isCorrect", isCorrect);
        result.put("correctAnswer", question.getCorrectAnswer());
        result.put("analysis", question.getAnalysis());
        result.put("analysisImages", question.getAnalysisImages());
        result.put("studentAnswer", studentAnswer);
        return result;
    }

    // ─────────────────────────────────────────────
    // 4. 获取错题本
    // ─────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> getWrongAnswers(Integer accountId, Integer questionBankId) {
        getVerifiedPracticeAccount(accountId);

        List<WrongAnswerBook> wrongBooks;
        if (questionBankId != null) {
            wrongBooks = wrongAnswerBookRepository
                    .findByAccountIdAndQuestionBankIdAndIsDeletedFalseOrderByLastWrongAtDesc(accountId, questionBankId);
        } else {
            wrongBooks = wrongAnswerBookRepository
                    .findByAccountIdAndIsDeletedFalseOrderByLastWrongAtDesc(accountId);
        }

        return wrongBooks.stream().map(wb -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", wb.getId());
            item.put("questionId", wb.getQuestionId());
            item.put("questionBankId", wb.getQuestionBankId());
            item.put("wrongCount", wb.getWrongCount());
            item.put("isResolved", wb.getIsResolved());
            item.put("lastWrongAt", wb.getLastWrongAt());
            item.put("resolvedAt", wb.getResolvedAt());

            // 附带题目基础信息
            questionRepository.findByIdAndIsDeletedFalse(wb.getQuestionId()).ifPresent(q -> {
                item.put("questionType", q.getQuestionType());
                item.put("content", q.getContent());
                item.put("options", q.getOptions());
                item.put("difficulty", q.getDifficulty());
                item.put("knowledgePoints", q.getKnowledgePoints());
            });
            return item;
        }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // 5. 标记已掌握
    // ─────────────────────────────────────────────

    @Override
    @Transactional
    public void resolveWrongAnswer(Integer accountId, Integer questionId) {
        getVerifiedPracticeAccount(accountId);
        WrongAnswerBook wb = wrongAnswerBookRepository
                .findByAccountIdAndQuestionIdAndIsDeletedFalse(accountId, questionId)
                .orElseThrow(() -> new BusinessException("错题记录不存在"));
        wb.setIsResolved(true);
        wb.setResolvedAt(LocalDateTime.now());
        wrongAnswerBookRepository.save(wb);
    }

    // ─────────────────────────────────────────────
    // 6. 删除错题本记录
    // ─────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteWrongAnswer(Integer accountId, Integer questionId) {
        getVerifiedPracticeAccount(accountId);
        WrongAnswerBook wb = wrongAnswerBookRepository
                .findByAccountIdAndQuestionIdAndIsDeletedFalse(accountId, questionId)
                .orElseThrow(() -> new BusinessException("错题记录不存在"));
        wb.setIsDeleted(true);
        wrongAnswerBookRepository.save(wb);
    }

    // ─────────────────────────────────────────────
    // 7. 统计数据
    // ─────────────────────────────────────────────

    @Override
    public Map<String, Object> getStats(Integer accountId) {
        getVerifiedPracticeAccount(accountId);

        long totalPracticed = practiceRecordRepository.countByAccountIdAndIsDeletedFalse(accountId);
        long totalCorrect = practiceRecordRepository.countByAccountIdAndIsCorrectTrueAndIsDeletedFalse(accountId);
        long totalWrong = wrongAnswerBookRepository.countByAccountIdAndIsResolvedFalseAndIsDeletedFalse(accountId);
        double accuracy = totalPracticed > 0 ? (double) totalCorrect / totalPracticed * 100 : 0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPracticed", totalPracticed);
        stats.put("totalCorrect", totalCorrect);
        stats.put("totalWrong", totalWrong);
        stats.put("accuracy", Math.round(accuracy * 10.0) / 10.0);
        return stats;
    }

    // ─────────────────────────────────────────────
    // 私有辅助方法
    // ─────────────────────────────────────────────

    /**
     * 校验账号存在且是 PRACTICE 类型
     */
    private Account getVerifiedPracticeAccount(Integer accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("账号不存在"));
        if (account.getAccountType() != AccountType.PRACTICE) {
            throw new BusinessException("仅练习账号可使用练习功能");
        }
        return account;
    }

    /**
     * 验证账号是否有访问该题库的权限
     */
    private void verifyBankAccess(Integer accountId, Integer questionBankId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("账号不存在"));
        List<Integer> bankIds = resolveAccessibleBankIds(account);
        if (!bankIds.contains(questionBankId)) {
            throw new BusinessException("无权访问该题库");
        }
    }

    /**
     * 根据账号的激活码 → 激活计划 → questionBankIds 解析可访问的题库ID列表
     */
    private List<Integer> resolveAccessibleBankIds(Account account) {
        if (account.getActivationCodeId() == null) {
            return Collections.emptyList();
        }
        return activationCodeRepository.findById(account.getActivationCodeId())
                .map(code -> {
                    if (code.getPlanId() == null) return Collections.<Integer>emptyList();
                    return activationPlanRepository.findByIdAndIsDeletedFalse(code.getPlanId())
                            .map(plan -> {
                                String bankIdsJson = plan.getQuestionBankIds();
                                if (bankIdsJson == null || bankIdsJson.isBlank()) {
                                    return Collections.<Integer>emptyList();
                                }
                                try {
                                    return objectMapper.readValue(bankIdsJson, new TypeReference<List<Integer>>() {});
                                } catch (Exception e) {
                                    log.warn("解析 questionBankIds JSON 失败: {}", bankIdsJson, e);
                                    return Collections.<Integer>emptyList();
                                }
                            })
                            .orElse(Collections.emptyList());
                })
                .orElse(Collections.emptyList());
    }

    /**
     * 判断答案是否正确
     * 对于选择题：标准化后比对（忽略大小写、空格，多选题排序后比对）
     * 对于判断题：true/false/对/错 映射后比对
     */
    private boolean judgeAnswer(Question question, String studentAnswer) {
        if (question.getCorrectAnswer() == null || studentAnswer == null) {
            return false;
        }
        String correct = question.getCorrectAnswer().trim().toUpperCase();
        String answer = studentAnswer.trim().toUpperCase();

        // 多选题：按字母排序后比对
        if (question.getQuestionType() != null) {
            String typeName = question.getQuestionType().name().toUpperCase();
            if (typeName.contains("MULTI") || typeName.contains("MULTIPLE")) {
                correct = sortLetters(correct);
                answer = sortLetters(answer);
            }
        }
        return correct.equals(answer);
    }

    private String sortLetters(String s) {
        // 移除分隔符，排序后重新拼接
        String cleaned = s.replaceAll("[^A-Z]", "");
        char[] chars = cleaned.toCharArray();
        Arrays.sort(chars);
        return new String(chars);
    }
}
