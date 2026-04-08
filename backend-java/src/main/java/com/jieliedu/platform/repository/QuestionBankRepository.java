package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.QuestionBank;
import com.jieliedu.platform.enums.GradeGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Integer> {

    List<QuestionBank> findByIsDeletedFalse();

    List<QuestionBank> findByGradeGroupAndIsDeletedFalse(GradeGroup gradeGroup);

    Page<QuestionBank> findByIsDeletedFalse(Pageable pageable);

    Page<QuestionBank> findByGradeGroupAndIsDeletedFalse(GradeGroup gradeGroup, Pageable pageable);

    Optional<QuestionBank> findByIdAndIsDeletedFalse(Integer id);

    long countByIsDeletedFalse();
}
