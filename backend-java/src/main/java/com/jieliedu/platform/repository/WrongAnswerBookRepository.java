package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.WrongAnswerBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WrongAnswerBookRepository extends JpaRepository<WrongAnswerBook, Integer> {

    List<WrongAnswerBook> findByAccountIdAndIsDeletedFalseOrderByLastWrongAtDesc(Integer accountId);

    List<WrongAnswerBook> findByAccountIdAndQuestionBankIdAndIsDeletedFalseOrderByLastWrongAtDesc(
            Integer accountId, Integer questionBankId);

    Optional<WrongAnswerBook> findByAccountIdAndQuestionIdAndIsDeletedFalse(
            Integer accountId, Integer questionId);

    long countByAccountIdAndIsResolvedFalseAndIsDeletedFalse(Integer accountId);

    long countByAccountIdAndQuestionBankIdAndIsResolvedFalseAndIsDeletedFalse(
            Integer accountId, Integer questionBankId);
}
