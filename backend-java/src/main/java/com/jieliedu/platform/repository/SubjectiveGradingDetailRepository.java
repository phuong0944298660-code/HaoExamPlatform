package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.SubjectiveGradingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectiveGradingDetailRepository extends JpaRepository<SubjectiveGradingDetail, Long> {

    List<SubjectiveGradingDetail> findByInstanceId(Long instanceId);
}
