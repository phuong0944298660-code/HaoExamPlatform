package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.Exam;
import com.jieliedu.platform.enums.ExamStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Integer> {

    Page<Exam> findByIsDeletedFalse(Pageable pageable);

    Optional<Exam> findByIdAndIsDeletedFalse(Integer id);

    List<Exam> findByStatusAndIsDeletedFalse(ExamStatus status);

    long countByIsDeletedFalse();

    List<Exam> findTop10ByIsDeletedFalseOrderByStartTimeDesc();
}
