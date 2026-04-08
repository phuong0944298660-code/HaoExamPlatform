package com.jieliedu.platform.service;



import java.util.List;
import java.util.Map;

/**
 * 练习功能服务接口
 */
public interface PracticeService {

    /**
     * 获取当前练习账号可访问的题库列表（通过激活码权限）
     *
     * @param accountId 账号ID
     * @return 题库列表（含练习进度）
     */
    List<Map<String, Object>> getAccessibleBanks(Integer accountId);

    /**
     * 获取题库题目列表（不含正确答案）
     *
     * @param accountId  账号ID
     * @param questionBankId 题库ID
     * @return 题目列表
     */
    List<Map<String, Object>> getBankQuestions(Integer accountId, Integer questionBankId);

    /**
     * 提交单题答案，立即返回判题结果
     *
     * @param accountId      账号ID
     * @param questionId     题目ID
     * @param questionBankId 题库ID
     * @param studentAnswer  学生答案
     * @return 判题结果（含正确答案、解析）
     */
    Map<String, Object> submitAnswer(Integer accountId, Integer questionId, Integer questionBankId, String studentAnswer);

    /**
     * 获取错题本列表
     *
     * @param accountId      账号ID
     * @param questionBankId 题库ID过滤（可空）
     * @return 错题列表（含题目详情）
     */
    List<Map<String, Object>> getWrongAnswers(Integer accountId, Integer questionBankId);

    /**
     * 标记错题为已掌握
     *
     * @param accountId  账号ID
     * @param questionId 题目ID
     */
    void resolveWrongAnswer(Integer accountId, Integer questionId);

    /**
     * 从错题本删除（软删除）
     *
     * @param accountId  账号ID
     * @param questionId 题目ID
     */
    void deleteWrongAnswer(Integer accountId, Integer questionId);

    /**
     * 获取练习统计数据
     *
     * @param accountId 账号ID
     * @return 统计（总题数、正确率、错题数等）
     */
    Map<String, Object> getStats(Integer accountId);
}
