package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.SysMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysMenuRepository extends JpaRepository<SysMenu, Long> {
    List<SysMenu> findAllByStatusOrderByOrderNumAsc(Integer status);
    Optional<SysMenu> findByMenuName(String menuName);
    boolean existsByParentId(Long parentId);
}
