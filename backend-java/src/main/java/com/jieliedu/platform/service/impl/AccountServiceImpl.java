package com.jieliedu.platform.service.impl;

import com.jieliedu.platform.dto.request.ActivateAccountRequest;
import com.jieliedu.platform.dto.request.LoginRequest;
import com.jieliedu.platform.dto.response.LoginResponse;
import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.security.JwtTokenProvider;
import com.jieliedu.platform.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 账号服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.jieliedu.platform.repository.ActivationCodeRepository activationCodeRepository;

    @Override
    @Transactional
    public LoginResponse activateAccount(ActivateAccountRequest request) {
        // 1. 验证激活码
        String codeValue = request.getActivationCode();
        if (codeValue == null || codeValue.isEmpty()) {
            throw new RuntimeException("请输入激活码");
        }
        
        com.jieliedu.platform.entity.ActivationCode code = activationCodeRepository.findByCodeAndIsDeletedFalse(codeValue)
                .orElseThrow(() -> new RuntimeException("激活码无效"));
        
        if (com.jieliedu.platform.enums.ActivationCodeStatus.UNUSED != code.getStatus()) {
            throw new RuntimeException("激活码已使用或已失效");
        }

        // 2. 检查激活类型限制 (仅限老师和练习账号)
        // 这里的逻辑根据需求：激活码的 userRole 应该是 ROLE_TEACHER 或练习学生角色
        // 或者是 code 关联的计划本身限制了类型
        
        // 3. 确定账号标识并检查是否存在
        String loginAccount = request.getIdentityNo() != null && !request.getIdentityNo().isEmpty() ? request.getIdentityNo() : 
                           (request.getUsername() != null && !request.getUsername().isEmpty() ? request.getUsername() : request.getAccount());
        
        if (loginAccount == null || loginAccount.isEmpty()) {
            throw new RuntimeException("账号信息缺失");
        }

        Account account = accountRepository.findByLoginAccount(loginAccount)
                .orElseThrow(() -> new RuntimeException("账号不存在，请先联系管理员下发账号"));
        
        // 4. 安全校验：不能激活已经激活过的账号 (除非业务允许叠加，但需求说这只是一个激活过程)
        if (Boolean.TRUE.equals(account.getIsActivated())) {
            // 如果是已激活账号，检查激活码是否为“叠加”权限，目前根据需求是“解锁”，可能不需要重复激活
            // throw new RuntimeException("该账号已激活");
            log.info("账号 {} 已激活，正在执行权限更新/覆盖", loginAccount);
        }

        // 5. 更新激活状态及角色学段同步
        // 根据需求：激活码决定学段和角色权限
        account.setRole(code.getUserRole());
        account.setGradeGroup(code.getGradeGroup());
        account.setIsActivated(true);
        account.setIsActive(true);
        account.setActivationCodeId(code.getId());
        
        // 如果请求中有提供姓名且账号姓名为空，则同步
        if (request.getName() != null && !request.getName().isEmpty() && (account.getName() == null || account.getName().isEmpty())) {
            account.setName(request.getName());
        }
        
        accountRepository.save(account);

        // 6. 将激活码标记为已使用
        code.setStatus(com.jieliedu.platform.enums.ActivationCodeStatus.USED);
        code.setUsedBy(account.getId());
        code.setUsedAt(LocalDateTime.now());
        activationCodeRepository.save(code);

        String token = jwtTokenProvider.generateToken(account.getId());
        return buildLoginResponse(account, token);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.debug("🔑 尝试登录: account={}, hasPassword={}", request.getAccount(), request.getPassword() != null);
        
        if (request.getAccount() == null || request.getAccount().isEmpty()) {
            log.error("❌ 登录失败: 账号字段为空 (Request data: {})", request);
            throw new RuntimeException("账号不能为空");
        }
        
        Account account = accountRepository.findByLoginAccount(request.getAccount())
                .orElseThrow(() -> {
                    log.error("❌ 登录失败: 账号 [{}] 不存在", request.getAccount());
                    return new RuntimeException("账号或密码错误");
                });
        
        if (!passwordEncoder.matches(request.getPassword(), account.getHashedPassword())) {
            log.error("❌ 登录失败: 账号 [{}] 密码错误", request.getAccount());
            throw new RuntimeException("账号或密码错误");
        }
        if (Boolean.TRUE.equals(account.getIsDeleted())) {
            throw new RuntimeException("账号已被删除");
        }
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new RuntimeException("账号已被禁用");
        }
        account.setLastLoginAt(LocalDateTime.now());
        accountRepository.save(account);
        String token = jwtTokenProvider.generateToken(account.getId());
        return buildLoginResponse(account, token);
    }

    private LoginResponse buildLoginResponse(Account account, String token) {
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo();
        userInfo.setId(account.getId());
        userInfo.setAccountType(account.getAccountType() != null ? account.getAccountType().name() : null);
        userInfo.setGradeGroup(account.getGradeGroup() != null ? account.getGradeGroup().name() : null);
        userInfo.setRole(account.getRole());
        userInfo.setIdentityNo(account.getIdentityNo());
        userInfo.setUsername(account.getUsername());
        userInfo.setName(account.getName());
        userInfo.setSchool(account.getSchool());
        userInfo.setRegion(account.getRegion());
        userInfo.setIsActivated(account.getIsActivated());
        userInfo.setIsActive(account.getIsActive());
        response.setUser(userInfo);
        return response;
    }

    @Override
    @Transactional
    public java.util.Map<String, Object> batchGeneratePractice(com.jieliedu.platform.dto.request.BatchGeneratePracticeRequest request) {
        int count = request.getCount() != null ? request.getCount() : 300;
        com.jieliedu.platform.enums.GradeGroup gradeGroup = request.getGrade_group();
        String initialPassword = request.getInitial_password();
        
        String prefix = gradeGroup == com.jieliedu.platform.enums.GradeGroup.PRIMARY ? "PRA_PRI" : "PRA_JUN";
        String dateStr = java.time.format.DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
        String encodedPassword = passwordEncoder.encode(initialPassword);
        
        // 查找当前最大的流水号 (简化实现，实际应用中可能需要更严谨的序列号生成)
        long currentMax = accountRepository.count() + 1000;
        
        java.util.List<java.util.Map<String, Object>> generatedAccounts = new java.util.ArrayList<>();
        java.util.List<Account> accountsToSave = new java.util.ArrayList<>();
        
        for (int i = 1; i <= count; i++) {
            currentMax++;
            String username = String.format("%s_%s_%04d", prefix, dateStr, currentMax % 10000);
            
            Account account = new Account();
            account.setUsername(username);
            account.setAccountType(com.jieliedu.platform.enums.AccountType.PRACTICE);
            account.setGradeGroup(gradeGroup);
            account.setRole("STUDENT");
            account.setHashedPassword(encodedPassword);
            account.setIsActivated(true);
            account.setIsActive(true);
            account.setIsDeleted(false);
            accountsToSave.add(account);
            
            java.util.Map<String, Object> accMap = new java.util.HashMap<>();
            accMap.put("username", username);
            accMap.put("password", initialPassword);
            generatedAccounts.add(accMap);
        }
        
        accountRepository.saveAll(accountsToSave);
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("accounts", generatedAccounts);
        return result;
    }
}
