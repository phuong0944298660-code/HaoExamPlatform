package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.ActivationCodeStatus;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jieliedu.platform.entity.Exam;
import com.jieliedu.platform.entity.Account;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 仪表盘控制器
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AccountRepository accountRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;
    private final ExamPaperRepository examPaperRepository;
    private final ExamRepository examRepository;
    // 移除了未使用的 assignmentRepository
    private final ResourceRepository resourceRepository;
    private final ActivationCodeRepository activationCodeRepository;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * 获取仪表盘统计数据
     */
    @GetMapping({"", "/stats"})
    public Result<?> getDashboard() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // 账号按学段+类型细分（前端期望字段）
        long primaryPractice = accountRepository.countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType.PRACTICE, GradeGroup.PRIMARY);
        long primaryExam = accountRepository.countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType.EXAM, GradeGroup.PRIMARY);
        long middlePractice = accountRepository.countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType.PRACTICE, GradeGroup.JUNIOR)
                + accountRepository.countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType.PRACTICE, GradeGroup.MIDDLE);
        long middleExam = accountRepository.countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType.EXAM, GradeGroup.JUNIOR)
                + accountRepository.countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType.EXAM, GradeGroup.MIDDLE);

        stats.put("primaryPractice", primaryPractice);
        stats.put("primaryExam", primaryExam);
        stats.put("middlePractice", middlePractice);
        stats.put("middleExam", middleExam);

        // 激活码统计
        long teacherCodes = activationCodeRepository.countByPlanTargetRoleAndIsDeletedFalse("teacher");
        long studentCodes = activationCodeRepository.countByPlanTargetRoleAndIsDeletedFalse("student");
        long remainingCodes = activationCodeRepository.countByStatusAndIsDeletedFalse(ActivationCodeStatus.UNUSED);

        stats.put("teacherCodes", teacherCodes);
        stats.put("studentCodes", studentCodes);
        stats.put("remainingCodes", remainingCodes);

        // 在线统计（简化：暂不实现实时在线数）
        stats.put("onlineCurrent", 0);
        stats.put("onlinePeak", 0);
        stats.put("onlineChange", 0);

        // 其他汇总数据（供参考）
        stats.put("accountCount", primaryPractice + primaryExam + middlePractice + middleExam);
        stats.put("questionBankCount", questionBankRepository.countByIsDeletedFalse());
        stats.put("questionCount", questionRepository.countByIsDeletedFalse());
        stats.put("paperCount", examPaperRepository.countByIsDeletedFalse());
        stats.put("examCount", examRepository.countByIsDeletedFalse());
        stats.put("resourceCount", resourceRepository.countByIsDeletedFalse());

        return Result.success(stats);
    }

    /**
     * 获取近期考试列表
     */
    @GetMapping("/recent-exams")
    public Result<?> getRecentExams() {
        List<Exam> exams = examRepository.findTop10ByIsDeletedFalseOrderByStartTimeDesc();
        List<Map<String, Object>> result = exams.stream().map(exam -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", exam.getId());
            map.put("name", exam.getName());
            // grade group mapping
            String grade = "primary";
            String gradeLabel = "小学";
            if (exam.getGradeGroup() != null) {
                switch (exam.getGradeGroup()) {
                    case JUNIOR:
                        grade = "middle";
                        gradeLabel = "初中";
                        break;
                    default:
                        grade = "primary";
                        gradeLabel = "小学";
                        break;
                }
            }
            map.put("grade", grade);
            map.put("gradeLabel", gradeLabel);
            // status mapping
            map.put("status", exam.getStatus() != null ? exam.getStatus().name().toLowerCase() : "draft");
            map.put("startTime", exam.getStartTime() != null ? exam.getStartTime().format(DTF) : "");
            map.put("duration", (exam.getDurationMinutes() != null ? exam.getDurationMinutes() : exam.getDuration()) + "分钟");
            map.put("joined", exam.getSubmittedCount() != null ? exam.getSubmittedCount() : 0);
            map.put("totalParticipants", exam.getParticipantCount() != null ? exam.getParticipantCount() : 
                     exam.getMaxStudents() != null ? exam.getMaxStudents() : 0);
            // creator - try to look up by createdBy
            String creator = "管理员";
            if (exam.getCreatedBy() != null) {
                Optional<Account> acc = accountRepository.findById(exam.getCreatedBy());
                if (acc.isPresent()) {
                    creator = acc.get().getName() != null ? acc.get().getName() : acc.get().getUsername();
                }
            }
            map.put("creator", creator);
            return map;
        }).collect(Collectors.toList());
        return Result.success(result);
    }
}
