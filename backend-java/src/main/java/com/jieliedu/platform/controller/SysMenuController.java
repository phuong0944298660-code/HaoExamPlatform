package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.SysMenu;
import com.jieliedu.platform.repository.SysMenuRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 菜单管理控制器
 */
@RestController
@RequestMapping("/api/v1/system/menus")
@RequiredArgsConstructor
public class SysMenuController {

    private final SysMenuRepository menuRepository;
    private final com.jieliedu.platform.repository.SysRoleRepository roleRepository;

    /**
     * 获取当前登录用户的导航菜单树
     */
    @GetMapping("/nav")
    public Result<?> getNavMenus(@CurrentUser UserPrincipal user) {
        String roleKey = user.getRole();
        if (roleKey == null) {
            return Result.success(new ArrayList<>());
        }

        List<SysMenu> filtered;
        if ("admin".equalsIgnoreCase(roleKey)) {
            // 管理员默认看到所有启用菜单
            filtered = menuRepository.findAll().stream()
                    .filter(m -> Objects.equals(m.getStatus(), 1))
                    .collect(Collectors.toList());
        } else {
            // 普通角色根据其分配的菜单过滤，且必须是启用状态
            filtered = roleRepository.findByRoleKey(roleKey.toLowerCase())
                    .map(role -> role.getMenus().stream()
                            .filter(m -> Objects.equals(m.getStatus(), 1))
                            .collect(Collectors.toList()))
                    .orElse(new ArrayList<>());
        }

        return Result.success(buildTree(filtered, 0L).stream()
                .sorted(java.util.Comparator.comparingInt(SysMenu::getOrderNum))
                .collect(Collectors.toList()));
    }

    /**
     * 查询所有菜单列表（返回树形结构）
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> list() {
        List<SysMenu> all = menuRepository.findAll();
        // 排序：按 orderNum 升序
        all.sort(java.util.Comparator.comparingInt(SysMenu::getOrderNum));
        return Result.success(buildTree(all, 0L));
    }

    /**
     * 新增菜单
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> create(@RequestBody SysMenu menu) {
        if (menu.getParentId() == null) {
            menu.setParentId(0L);
        }
        return Result.success(menuRepository.save(menu));
    }

    /**
     * 更新菜单
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> update(@PathVariable Long id, @RequestBody SysMenu menu) {
        SysMenu existing = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("菜单不存在"));
        
        existing.setMenuName(menu.getMenuName());
        existing.setParentId(menu.getParentId());
        existing.setOrderNum(menu.getOrderNum());
        existing.setPath(menu.getPath());
        existing.setComponent(menu.getComponent());
        existing.setMenuType(menu.getMenuType());
        existing.setVisible(menu.getVisible());
        existing.setStatus(menu.getStatus());
        existing.setPerms(menu.getPerms());
        existing.setIcon(menu.getIcon());
        existing.setRemark(menu.getRemark());
        
        return Result.success(menuRepository.save(existing));
    }

    /**
     * 删除菜单
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> delete(@PathVariable Long id) {
        if (menuRepository.existsByParentId(id)) {
            return Result.error("存在子菜单，不允许删除");
        }
        menuRepository.deleteById(id);
        return Result.success("删除成功");
    }

    /**
     * 构建树结构
     */
    private List<SysMenu> buildTree(List<SysMenu> menus, Long parentId) {
        List<SysMenu> tree = new ArrayList<>();
        for (SysMenu menu : menus) {
            if (Objects.equals(menu.getParentId(), parentId)) {
                List<SysMenu> children = buildTree(menus, menu.getId());
                if (!children.isEmpty()) {
                    menu.setChildren(children);
                } else {
                    menu.setChildren(null); // 设置为 null，前端 a-table 就会自动隐藏展开图标
                }
                tree.add(menu);
            }
        }
        return tree;
    }
}
