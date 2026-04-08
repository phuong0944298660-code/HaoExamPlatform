package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.Question;
import com.jieliedu.platform.enums.QuestionDifficulty;
import com.jieliedu.platform.enums.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    Page<Question> findByIsDeletedFalse(Pageable pageable);

    Page<Question> findByQuestionBankIdAndIsDeletedFalse(Integer questionBankId, Pageable pageable);

    Page<Question> findByQuestionBankIdAndQuestionTypeAndIsDeletedFalse(Integer questionBankId, QuestionType questionType, Pageable pageable);

    Page<Question> findByQuestionBankIdAndDifficultyAndIsDeletedFalse(Integer questionBankId, QuestionDifficulty difficulty, Pageable pageable);

    Page<Question> findByQuestionBankIdAndQuestionTypeAndDifficultyAndIsDeletedFalse(Integer questionBankId, QuestionType questionType, QuestionDifficulty difficulty, Pageable pageable);

    Page<Question> findByQuestionTypeAndIsDeletedFalse(QuestionType questionType, Pageable pageable);

    Page<Question> findByDifficultyAndIsDeletedFalse(QuestionDifficulty difficulty, Pageable pageable);

    Page<Question> findByQuestionTypeAndDifficultyAndIsDeletedFalse(QuestionType questionType, QuestionDifficulty difficulty, Pageable pageable);

    Optional<Question> findByIdAndIsDeletedFalse(Integer id);

    List<Question> findByIdInAndIsDeletedFalse(List<Integer> ids);

    List<Question> findByQuestionBankIdAndIsDeletedFalse(Integer questionBankId);

    long countByIsDeletedFalse();

    long countByQuestionBankIdAndIsDeletedFalse(Integer questionBankId);
}
