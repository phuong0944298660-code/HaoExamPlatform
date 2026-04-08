package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.ActivationCode;
import com.jieliedu.platform.enums.ActivationCodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivationCodeRepository extends JpaRepository<ActivationCode, Integer> {

    java.util.Optional<ActivationCode> findByCodeAndIsDeletedFalse(String code);

    Page<ActivationCode> findByIsDeletedFalse(Pageable pageable);

    Page<ActivationCode> findByPlanIdAndIsDeletedFalse(Integer planId, Pageable pageable);

    Page<ActivationCode> findByStatusAndIsDeletedFalse(ActivationCodeStatus status, Pageable pageable);

    long countByIsDeletedFalse();

    long countByStatusAndIsDeletedFalse(ActivationCodeStatus status);

    @Query("SELECT COUNT(c) FROM ActivationCode c WHERE c.planId IN (SELECT p.id FROM ActivationPlan p WHERE p.targetRole = :role) AND c.isDeleted = false")
    long countByPlanTargetRoleAndIsDeletedFalse(@Param("role") String role);
}
