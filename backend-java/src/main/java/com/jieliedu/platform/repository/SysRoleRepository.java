package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.SysRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SysRoleRepository extends JpaRepository<SysRole, Long> {
    Optional<SysRole> findByRoleKey(String roleKey);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM SysRole r WHERE r.roleName LIKE %:name% OR :name IS NULL")
    org.springframework.data.domain.Page<SysRole> search(@org.springframework.data.repository.query.Param("name") String name, org.springframework.data.domain.Pageable pageable);
}
