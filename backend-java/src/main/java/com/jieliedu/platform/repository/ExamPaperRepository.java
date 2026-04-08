package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.ExamPaper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamPaperRepository extends JpaRepository<ExamPaper, Integer> {

    Page<ExamPaper> findByIsDeletedFalse(Pageable pageable);

    Optional<ExamPaper> findByIdAndIsDeletedFalse(Integer id);

    long countByIsDeletedFalse();
}
