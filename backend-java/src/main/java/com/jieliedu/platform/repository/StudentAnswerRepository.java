package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {

    List<StudentAnswer> findByExamIdAndStudentId(Long examId, Long studentId);
}
