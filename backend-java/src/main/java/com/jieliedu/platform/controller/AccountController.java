package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.request.ActivateAccountRequest;
import com.jieliedu.platform.dto.request.LoginRequest;
import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.security.JwtTokenProvider;
import com.jieliedu.platform.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 账号控制器
 */
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /**
     * 账号列表（支持筛选，分页）
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> list(
            @RequestParam(required = false) AccountType accountType,
            @RequestParam(required = false) GradeGroup gradeGroup,
            @RequestParam(required = false) Boolean isActivated,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String school,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        // 如果学段是 ALL，视为查询全部（即屏蔽该筛选条件）
        GradeGroup groupParam = (gradeGroup == GradeGroup.ALL) ? null : gradeGroup;
        Page<Account> result = accountRepository.search(accountType, groupParam, isActivated, role, school, search, pageable);
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    @GetMapping("/schools")
    @PreAuthorize("isAuthenticated()")
    public Result<?> getSchools() {
        return Result.success(accountRepository.findAllSchools());
    }

    /**
     * 批量生成考试账号
     */
    @PostMapping("/batch/exam")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> batchGenerateExam(@RequestBody java.util.Map<String, Object> request) {
        java.util.List<java.util.Map<String, String>> students = (java.util.List<java.util.Map<String, String>>) request.get("students");
        String grade = (String) request.get("grade_group");
        String password = (String) request.get("initial_password");
        
        if (students == null || students.isEmpty()) return Result.error("学生名单不能为空");
        
        for (java.util.Map<String, String> student : students) {
            Account account = new Account();
            account.setIdentityNo(student.get("identity_no"));
            account.setUsername(student.get("identity_no")); // 考试账号默认用身份证做账号
            account.setName(student.get("name"));
            account.setSchool(student.get("school"));
            account.setHashedPassword(passwordEncoder.encode(password != null ? password : "admin123"));
            account.setAccountType(AccountType.EXAM);
            account.setRole("STUDENT");
            try {
                account.setGradeGroup(grade != null ? GradeGroup.valueOf(grade.toUpperCase()) : GradeGroup.PRIMARY);
            } catch (Exception e) {
                account.setGradeGroup(GradeGroup.PRIMARY);
            }
            account.setIsActivated(true);
            account.setIsActive(true);
            account.setIsDeleted(false);
            accountRepository.save(account);
        }
        return Result.success("成功批量生成 " + students.size() + " 个考试账号");
    }

    /**
     * 账号详情
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> detail(@PathVariable Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("账号不存在"));
        return Result.success(account);
    }

    @PostMapping("/activate")
    public Result<?> activateAccount(@RequestBody ActivateAccountRequest request) {
        return Result.success(accountService.activateAccount(request));
    }

    @PostMapping("/login")
    public Result<?> login(@RequestBody LoginRequest request) {
        return Result.success(accountService.login(request));
    }

    @PostMapping("/logout")
    public Result<?> logout() {
        return Result.success(null);
    }

    @PostMapping("/refresh")
    @PreAuthorize("isAuthenticated()")
    public Result<com.jieliedu.platform.dto.response.LoginResponse> refreshToken(@com.jieliedu.platform.security.CurrentUser com.jieliedu.platform.security.UserPrincipal user) {
        if (user == null) {
            return Result.error(401, "未登录或会话已过期");
        }
        Account account = accountRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("账号不存在"));
        
        String newToken = jwtTokenProvider.generateToken(account.getId());
        
        com.jieliedu.platform.dto.response.LoginResponse response = new com.jieliedu.platform.dto.response.LoginResponse();
        response.setToken(newToken);
        
        com.jieliedu.platform.dto.response.LoginResponse.UserInfo userInfo = new com.jieliedu.platform.dto.response.LoginResponse.UserInfo();
        userInfo.setId(account.getId());
        userInfo.setRole(account.getRole());
        userInfo.setUsername(account.getUsername());
        userInfo.setName(account.getName());
        userInfo.setIsActivated(account.getIsActivated());
        userInfo.setIsActive(account.getIsActive());
        response.setUser(userInfo);
        
        return Result.success(response);
    }

    @GetMapping("/heartbeat")
    public Result<?> heartbeat() {
        return Result.success(null);
    }

    @PostMapping("/batch/practice")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public Result<?> batchGeneratePractice(@RequestBody com.jieliedu.platform.dto.request.BatchGeneratePracticeRequest request) {
        return Result.success(accountService.batchGeneratePractice(request));
    }

    /**
     * 手动新增普通账号（练习、考试、系统管理员）
     */
    @PostMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> toggleStatus(@PathVariable Integer id, @RequestParam("is_active") Boolean isActive) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("账号不存在"));
        account.setIsActive(isActive);
        accountRepository.save(account);
        return Result.success(account);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> createAccount(@RequestBody java.util.Map<String, Object> request) {
        String username = (String) request.get("username");
        String identityNo = (String) request.get("identity_no");
        String password = (String) request.get("password");
        String name = (String) request.get("name");
        String role = (String) request.get("role");
        String type = (String) request.get("account_type");
        String grade = (String) request.get("grade_group");
        String school = (String) request.get("school");

        if (type == null) return Result.error("账号类型必填");
        
        Account account = new Account();
        account.setUsername(username);
        account.setIdentityNo(identityNo);
        // 如果是考试账号，用户名使用身份证号
        if ("EXAM".equals(type) && (username == null || username.isEmpty())) {
            account.setUsername(identityNo);
        }
        
        account.setHashedPassword(passwordEncoder.encode(password != null && !password.isEmpty() ? password : "admin123"));
        account.setName(name);
        account.setRole(role != null ? role.toUpperCase() : "STUDENT");
        
        try {
            account.setAccountType(AccountType.valueOf(type.toUpperCase()));
        } catch (Exception e) {
            account.setAccountType(AccountType.PRACTICE);
        }
        
        try {
            account.setGradeGroup(grade != null ? GradeGroup.valueOf(grade.toUpperCase()) : GradeGroup.PRIMARY);
        } catch (Exception e) {
            account.setGradeGroup(GradeGroup.PRIMARY);
        }
        
        account.setSchool(school);
        account.setIsActivated(true);
        account.setIsActive(true);
        account.setIsDeleted(false);
        account.setVersion(1);
        
        accountRepository.save(account);
        return Result.success(account);
    }

    /**
     * 更新账号
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> updateAccount(@PathVariable Integer id, @RequestBody java.util.Map<String, Object> request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("账号不存在"));
        
        // 兼容 name 和 nickname
        if (request.containsKey("nickname")) account.setName((String) request.get("nickname"));
        else if (request.containsKey("name")) account.setName((String) request.get("name"));
        
        if (request.containsKey("school")) account.setSchool((String) request.get("school"));
        
        if (request.containsKey("grade_group") && request.get("grade_group") != null) {
            String gg = (String) request.get("grade_group");
            try {
                account.setGradeGroup(GradeGroup.valueOf(gg.toUpperCase()));
            } catch (Exception e) {
                // ignore
            }
        }
        
        if (request.containsKey("password") && request.get("password") != null && !((String)request.get("password")).isEmpty()) {
            account.setHashedPassword(passwordEncoder.encode((String) request.get("password")));
        }

        // 处理角色变更
        if (request.containsKey("role") && request.get("role") != null) {
            account.setRole(((String) request.get("role")).toUpperCase());
        }
        
        accountRepository.save(account);
        return Result.success("更新成功");
    }

    /**
     * 删除账号（软删除）
     * 注意：修改 username 添加时间戳后缀，避免与已删除的同名账号冲突
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> deleteAccount(@PathVariable Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("账号不存在"));
        account.setIsDeleted(true);
        // 修改 username 添加时间戳后缀，避免与已删除的同名账号冲突
        String timestamp = String.valueOf(System.currentTimeMillis());
        String deletedUsername = account.getUsername() + "_deleted_" + timestamp;
        account.setUsername(deletedUsername);
        // 同样处理 identity_no（如果存在）
        if (account.getIdentityNo() != null && !account.getIdentityNo().isEmpty()) {
            account.setIdentityNo(account.getIdentityNo() + "_deleted_" + timestamp);
        }
        accountRepository.save(account);
        return Result.success("删除成功");
    }
}
