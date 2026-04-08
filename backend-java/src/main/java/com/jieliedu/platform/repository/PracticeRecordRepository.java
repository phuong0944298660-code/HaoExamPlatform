package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.PracticeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeRecordRepository extends JpaRepository<PracticeRecord, Integer> {

    List<PracticeRecord> findByAccountIdAndIsDeletedFalseOrderByPracticeAtDesc(Integer accountId);

    List<PracticeRecord> findByAccountIdAndQuestionBankIdAndIsDeletedFalseOrderByPracticeAtDesc(
            Integer accountId, Integer questionBankId);

    long countByAccountIdAndIsDeletedFalse(Integer accountId);

    long countByAccountIdAndIsCorrectTrueAndIsDeletedFalse(Integer accountId);

    long countByAccountIdAndQuestionBankIdAndIsDeletedFalse(Integer accountId, Integer questionBankId);

    long countByAccountIdAndQuestionBankIdAndIsCorrectTrueAndIsDeletedFalse(
            Integer accountId, Integer questionBankId);

    @Query("SELECT DISTINCT pr.questionId FROM PracticeRecord pr WHERE pr.accountId = :accountId AND pr.questionBankId = :bankId AND pr.isDeleted = false")
    List<Integer> findPracticedQuestionIdsByAccountIdAndBankId(
            @Param("accountId") Integer accountId, @Param("bankId") Integer bankId);
}
