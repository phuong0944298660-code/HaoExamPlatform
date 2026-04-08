package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.StudentExamAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentExamAssignmentRepository extends JpaRepository<StudentExamAssignment, Integer> {

    Page<StudentExamAssignment> findByExamIdAndIsDeletedFalse(Integer examId, Pageable pageable);

    Page<StudentExamAssignment> findByIsDeletedFalse(Pageable pageable);

    Optional<StudentExamAssignment> findByIdAndIsDeletedFalse(Integer id);

    Optional<StudentExamAssignment> findByExamIdAndAccountIdAndIsDeletedFalse(Integer examId, Integer accountId);

    long countByIsDeletedFalse();
}
