package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.SysMenu;
import com.jieliedu.platform.entity.SysRole;
import com.jieliedu.platform.repository.SysRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 角色管理控制器
 */
@RestController
@RequestMapping("/api/v1/system/roles")
@RequiredArgsConstructor
public class SysRoleController {

    private final SysRoleRepository roleRepository;

    /**
     * 获取角色列表
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> list(
            @RequestParam(required = false) String roleName,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<SysRole> result = roleRepository.search(roleName, pageable);
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 保存角色（新增/更新）
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> save(@RequestBody SysRole role) {
        if (role.getRoleKey() == null || role.getRoleKey().isEmpty()) {
            return Result.error("角色标识不能为空");
        }
        
        // 如果有传菜单ID，自动同步关联表
        if (role.getMenuIds() != null) {
            role.setMenus(new java.util.HashSet<>());
            for (Long mid : role.getMenuIds()) {
                com.jieliedu.platform.entity.SysMenu m = new com.jieliedu.platform.entity.SysMenu();
                m.setId(mid);
                role.getMenus().add(m);
            }
        }
        
        roleRepository.save(role);
        return Result.success(role);
    }

    /**
     * 获取角色详情
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(roleRepository.findById(id).orElseThrow(() -> new RuntimeException("角色不存在")));
    }

    /**
     * 获取角色已分配的菜单ID列表
     */
    @GetMapping("/{id}/menus")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> getRoleMenus(@PathVariable Long id) {
        SysRole role = roleRepository.findById(id).orElseThrow(() -> new RuntimeException("角色不存在"));
        return Result.success(role.getMenus().stream().map(m -> m.getId()).collect(java.util.stream.Collectors.toList()));
    }

    /**
     * 分配菜单权限
     */
    @PostMapping("/{id}/menus")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> allocateMenus(@PathVariable Long id, @RequestBody java.util.List<Long> menuIds) {
        SysRole role = roleRepository.findById(id).orElseThrow(() -> new RuntimeException("角色不存在"));
        // 简单处理：清空再添加
        role.getMenus().clear();
        for (Long menuId : menuIds) {
            SysMenu m = new SysMenu();
            m.setId(menuId);
            role.getMenus().add(m);
        }
        roleRepository.save(role);
        return Result.success();
    }

    /**
     * 删除角色
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> delete(@PathVariable Long id) {
        roleRepository.deleteById(id);
        return Result.success();
    }
}
