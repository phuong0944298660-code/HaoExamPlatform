package com.jieliedu.platform.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * Account API集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
public class AccountApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testHeartbeatEndpointExists() throws Exception {
        // 测试心跳检测端点
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(get("/api/v1/accounts/heartbeat")
                        .contentType(mediaType))
                .andReturn();
        
        int status = result.getResponse().getStatus();
        System.out.println("Heartbeat Endpoint Status: " + status);
        
        // 心跳检测应该是公开的或返回200/401/403，但不能是404
        assertNotEquals(404, status, "AccountController的/heartbeat端点应该存在");
    }

    @Test
    void testRefreshTokenEndpointExists() throws Exception {
        // 测试Token刷新端点
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(post("/api/v1/accounts/refresh")
                        .header("Authorization", "Bearer invalid-token")
                        .contentType(mediaType))
                .andReturn();
        
        int status = result.getResponse().getStatus();
        System.out.println("Refresh Token Endpoint Status: " + status);
        
        // 端点应该存在（返回401/403/200都是正常的，说明端点已注册）
        assertNotEquals(404, status, "AccountController的/refresh端点应该存在");
    }

    @Test
    void testGetCurrentUserEndpointExists() throws Exception {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(get("/api/v1/accounts/me")
                        .contentType(mediaType))
                .andReturn();
        
        int status = result.getResponse().getStatus();
        System.out.println("Get Current User Endpoint Status: " + status);
        assertNotEquals(404, status, "AccountController的/me端点应该存在");
    }

    @Test
    void testLoginEndpointExists() throws Exception {
        String loginJson = "{\"username\":\"test\",\"password\":\"test123\"}";
        
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(post("/api/v1/accounts/login")
                        .contentType(mediaType)
                        .content(loginJson))
                .andReturn();
        
        int status = result.getResponse().getStatus();
        System.out.println("Login Endpoint Status: " + status);
        assertNotEquals(404, status, "AccountController的/login端点应该存在");
    }
}
