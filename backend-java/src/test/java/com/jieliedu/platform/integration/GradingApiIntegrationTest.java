package com.jieliedu.platform.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 评分API集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
public class GradingApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "TEACHER")
    void testGradingTasksEndpointExists() throws Exception {
        // 测试评分任务列表端点是否存在
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(get("/api/v1/grading/tasks")
                        .contentType(mediaType))
                .andReturn();
        
        // 记录响应状态
        int status = result.getResponse().getStatus();
        System.out.println("Grading Tasks Endpoint Status: " + status);
        
        // 只要不是404（Not Found）就是成功，说明端点已注册
        // 其他状态（401/403/200/500）都是正常的，取决于具体实现
        assertNotEquals(404, status, "GradingController的/grading/tasks端点应该存在");
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void testGradingStatisticsEndpointExists() throws Exception {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(get("/api/v1/grading/statistics/1")
                        .contentType(mediaType))
                .andReturn();
        
        int status = result.getResponse().getStatus();
        System.out.println("Grading Statistics Endpoint Status: " + status);
        assertNotEquals(404, status, "GradingController的/statistics/{examId}端点应该存在");
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void testGradingRubricsEndpointExists() throws Exception {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        MvcResult result = mockMvc.perform(get("/api/v1/grading/rubrics/1")
                        .contentType(mediaType))
                .andReturn();
        
        int status = result.getResponse().getStatus();
        System.out.println("Grading Rubrics Endpoint Status: " + status);
        assertNotEquals(404, status, "GradingController的/rubrics/{questionId}端点应该存在");
    }

    @Test
    void testGradingEndpointWithoutAuth() throws Exception {
        // 测试未认证访问
        MediaType mediaType = MediaType.APPLICATION_JSON;
        mockMvc.perform(get("/api/v1/grading/tasks")
                        .contentType(mediaType))
                .andExpect(status().isUnauthorized());
    }
}
