package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.PaperQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperQuestionRepository extends JpaRepository<PaperQuestion, Integer> {

    List<PaperQuestion> findByPaperIdAndIsDeletedFalse(Integer paperId);
}
