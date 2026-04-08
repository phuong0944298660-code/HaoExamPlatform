package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.EventFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Integer> {

    Page<EventFeedback> findByIsDeletedFalse(Pageable pageable);

    Optional<EventFeedback> findByIdAndIsDeletedFalse(Integer id);
}
