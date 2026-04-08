package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 系统配置控制器 - 用户管理
 * 角色管理和菜单管理已迁移至独立的控制器
 */
@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemController {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    // 角色管理和菜单管理已迁移至 SysRoleController 和 SysMenuController

    // --- 用户管理 ---

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Account> allUsers = accountRepository.findAll();
        int total = allUsers.size();
        int fromIndex = (page - 1) * size;
        int toIndex = Math.min(fromIndex + size, total);
        
        List<Account> pagedUsers = (fromIndex < total) ? allUsers.subList(fromIndex, toIndex) : List.of();
        
        return Result.success(Map.of(
            "list", pagedUsers,
            "total", total
        ));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Account> createUser(@RequestBody Account account) {
        if (accountRepository.findByUsername(account.getUsername()).isPresent()) {
            return Result.error("用户名已存在");
        }
        
        // 自动补全必要字段
        if (account.getAccountType() == null) {
            account.setAccountType(AccountType.SYSTEM);
        }
        if (account.getGradeGroup() == null) {
            account.setGradeGroup(GradeGroup.ALL);
        }
        
        // 密码加密
        String rawPassword = account.getPassword() != null ? account.getPassword() : "123456";
        account.setHashedPassword(passwordEncoder.encode(rawPassword));
        
        account.setIsActivated(true);
        account.setIsActive(true);
        
        return Result.success(accountRepository.save(account));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Account> updateUser(@PathVariable Long id, @RequestBody Account updateData) {
        Account user = accountRepository.findById(id.intValue()).orElseThrow();
        
        if (updateData.getName() != null) user.setName(updateData.getName());
        if (updateData.getRole() != null) user.setRole(updateData.getRole());
        if (updateData.getPassword() != null && !updateData.getPassword().isEmpty()) {
            user.setHashedPassword(passwordEncoder.encode(updateData.getPassword()));
        }
        if (updateData.getIsActive() != null) user.setIsActive(updateData.getIsActive());
        
        return Result.success(accountRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> deleteUser(@PathVariable Long id) {
        accountRepository.deleteById(id.intValue());
        return Result.success(null);
    }

    // --- 系统配置 Stub 接口 (防止导航 500) ---

    @GetMapping("/depts")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<?>> getDepts() {
        return Result.success(List.of());
    }

    @GetMapping("/dict")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<?>> getDicts() {
        return Result.success(List.of());
    }

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<?>> getConfigs() {
        return Result.success(List.of());
    }

    @GetMapping("/notice")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<?>> getNotices() {
        return Result.success(List.of());
    }

    @GetMapping("/logs/operation")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<?>> getOperationLogs() {
        return Result.success(List.of());
    }

    @GetMapping("/logs/login")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<?>> getLoginLogs() {
        return Result.success(List.of());
    }
}
