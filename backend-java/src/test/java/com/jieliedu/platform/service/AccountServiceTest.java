package com.jieliedu.platform.service;

import com.jieliedu.platform.dto.request.ActivateAccountRequest;
import com.jieliedu.platform.dto.request.LoginRequest;
import com.jieliedu.platform.dto.response.LoginResponse;
import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 账号服务测试
 */
@SpringBootTest
@Transactional
public class AccountServiceTest {

    @Autowired
    private AccountService accountService;

    @MockBean
    private AccountRepository accountRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    public void testActivateAccount_Success() {
        // 准备测试数据
        ActivateAccountRequest request = new ActivateAccountRequest();
        request.setAccount("test123");
        request.setActivationCode("ABC123");
        request.setPassword("newpassword");

        Account account = new Account();
        account.setId(1);
        account.setUsername("test123");
        account.setActivationCodeId(1);
        account.setIsActivated(false);
        account.setAccountType(AccountType.PRACTICE);
        account.setGradeGroup(GradeGroup.JUNIOR);

        when(accountRepository.findByLoginAccount("test123"))
                .thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class)))
                .thenReturn(account);
        when(passwordEncoder.encode("newpassword"))
                .thenReturn("encodedPassword");
        when(jwtTokenProvider.generateToken(any(Integer.class)))
                .thenReturn("test-token");

        // 执行测试
        LoginResponse response = accountService.activateAccount(request);

        // 验证结果
        assertNotNull(response);
        assertEquals("test-token", response.getToken());
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    public void testActivateAccount_AlreadyActive() {
        // 准备测试数据
        ActivateAccountRequest request = new ActivateAccountRequest();
        request.setAccount("test123");
        request.setActivationCode("ABC123");

        Account account = new Account();
        account.setId(1);
        account.setUsername("test123");
        account.setActivationCodeId(1);
        account.setIsActivated(true); // 已激活
        account.setAccountType(AccountType.PRACTICE);
        account.setGradeGroup(GradeGroup.JUNIOR);

        when(accountRepository.findByLoginAccount("test123"))
                .thenReturn(Optional.of(account));

        // 执行测试并验证异常
        Exception exception = assertThrows(RuntimeException.class, () -> {
            accountService.activateAccount(request);
        });

        assertEquals("账号已激活，无需重复激活", exception.getMessage());
    }

    @Test
    public void testLogin_Success() {
        // 准备测试数据
        LoginRequest request = new LoginRequest();
        request.setAccount("test123");
        request.setPassword("password");

        Account account = new Account();
        account.setId(1);
        account.setUsername("test123");
        account.setHashedPassword("encodedPassword");
        account.setIsActivated(true);
        account.setIsActive(true);
        account.setAccountType(AccountType.PRACTICE);
        account.setGradeGroup(GradeGroup.JUNIOR);
        account.setName("测试用户");

        when(accountRepository.findByLoginAccount("test123"))
                .thenReturn(Optional.of(account));
        when(passwordEncoder.matches("password", "encodedPassword"))
                .thenReturn(true);
        when(jwtTokenProvider.generateToken(any(Integer.class)))
                .thenReturn("test-token");

        // 执行测试
        LoginResponse response = accountService.login(request);

        // 验证结果
        assertNotNull(response);
        assertEquals("test-token", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("测试用户", response.getUser().getName());
    }

    @Test
    public void testLogin_WrongPassword() {
        // 准备测试数据
        LoginRequest request = new LoginRequest();
        request.setAccount("test123");
        request.setPassword("wrongpassword");

        Account account = new Account();
        account.setId(1);
        account.setUsername("test123");
        account.setHashedPassword("encodedPassword");
        account.setIsActivated(true);
        account.setIsActive(true);
        account.setAccountType(AccountType.PRACTICE);
        account.setGradeGroup(GradeGroup.JUNIOR);

        when(accountRepository.findByLoginAccount("test123"))
                .thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword"))
                .thenReturn(false);

        // 执行测试并验证异常
        Exception exception = assertThrows(RuntimeException.class, () -> {
            accountService.login(request);
        });

        assertEquals("账号或密码错误", exception.getMessage());
    }

    @Test
    public void testLogin_AccountNotActive() {
        // 准备测试数据
        LoginRequest request = new LoginRequest();
        request.setAccount("test123");
        request.setPassword("password");

        Account account = new Account();
        account.setId(1);
        account.setUsername("test123");
        account.setHashedPassword("encodedPassword");
        account.setIsActivated(false); // 未激活
        account.setAccountType(AccountType.PRACTICE);
        account.setGradeGroup(GradeGroup.JUNIOR);

        when(accountRepository.findByLoginAccount("test123"))
                .thenReturn(Optional.of(account));
        when(passwordEncoder.matches("password", "encodedPassword"))
                .thenReturn(true);

        // 执行测试并验证异常
        Exception exception = assertThrows(RuntimeException.class, () -> {
            accountService.login(request);
        });

        assertEquals("账号未激活", exception.getMessage());
    }
}
