package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Integer> {

    Page<Resource> findByIsDeletedFalse(Pageable pageable);

    Optional<Resource> findByIdAndIsDeletedFalse(Integer id);

    Page<Resource> findByIdInAndIsDeletedFalse(java.util.List<Integer> ids, Pageable pageable);

    long countByIsDeletedFalse();
}
