package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final AccountRepository accountRepository;

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public Result<?> getCurrentUser(@CurrentUser UserPrincipal user) {
        Account account = accountRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", account.getId());
        profile.put("username", account.getUsername());
        profile.put("name", account.getName());
        profile.put("role", account.getRole());
        profile.put("accountType", account.getAccountType());
        profile.put("gradeGroup", account.getGradeGroup());
        profile.put("school", account.getSchool());
        profile.put("region", account.getRegion());
        profile.put("contactPhone", account.getContactPhone());
        profile.put("isActivated", account.getIsActivated());
        profile.put("lastLoginAt", account.getLastLoginAt());
        return Result.success(profile);
    }

    /**
     * 更新当前用户信息
     */
    @PutMapping("/me")
    public Result<?> updateCurrentUser(@CurrentUser UserPrincipal user, @RequestBody Map<String, String> request) {
        Account account = accountRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (request.containsKey("name")) {
            account.setName(request.get("name"));
        }
        if (request.containsKey("school")) {
            account.setSchool(request.get("school"));
        }
        if (request.containsKey("region")) {
            account.setRegion(request.get("region"));
        }
        if (request.containsKey("contactPhone")) {
            account.setContactPhone(request.get("contactPhone"));
        }

        accountRepository.save(account);
        return Result.success(account);
    }
}
