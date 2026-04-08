package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.ExamInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamInstanceRepository extends JpaRepository<ExamInstance, Long> {

    Optional<ExamInstance> findByExamIdAndStudentId(Long examId, Long studentId);

    List<ExamInstance> findByExamIdAndGradingStatus(Long examId, ExamInstance.GradingStatus status);
}
