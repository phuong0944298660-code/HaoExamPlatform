package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.request.ActivateAccountRequest;
import com.jieliedu.platform.dto.request.LoginRequest;
import com.jieliedu.platform.dto.response.ResultCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 账号控制器集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AccountControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testActivateAccountEndpoint() throws Exception {
        // 准备测试数据
        ActivateAccountRequest request = new ActivateAccountRequest();
        request.setAccount("test123");
        request.setActivationCode("ABC123");
        request.setPassword("password123");

        // 执行测试
        mockMvc.perform(post("/api/v1/accounts/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.message").value("账号激活成功"));
    }

    @Test
    public void testLoginEndpoint() throws Exception {
        // 准备测试数据
        LoginRequest request = new LoginRequest();
        request.setAccount("admin");
        request.setPassword("admin123");

        // 执行测试
        mockMvc.perform(post("/api/v1/accounts/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.message").value("登录成功"));
    }

    @Test
    public void testLogoutEndpoint() throws Exception {
        // 执行测试（需要认证）
        mockMvc.perform(post("/api/v1/accounts/logout")
                .header("Authorization", "Bearer test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.message").value("登出成功"));
    }

    @Test
    public void testRegisterEndpoint() throws Exception {
        // 执行测试
        mockMvc.perform(post("/auth/register")
                .param("account", "newuser")
                .param("password", "password123")
                .param("studentName", "新用户"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.SUCCESS.getCode()));
    }

    @Test
    public void testRefreshTokenEndpoint() throws Exception {
        // 执行测试（需要有效的token）
        mockMvc.perform(post("/auth/refresh")
                .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.data.token").exists());
    }
}
