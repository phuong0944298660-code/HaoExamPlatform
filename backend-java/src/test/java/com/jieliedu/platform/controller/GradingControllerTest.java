package com.jieliedu.platform.controller;

import com.jieliedu.platform.service.GradingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GradingController单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
public class GradingControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @MockBean
    private GradingService gradingService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void testGetPendingTasksEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/grading/tasks"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetPendingTasksAsAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/grading/tasks"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetPendingTasksWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/grading/tasks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void testGetPendingTasksAsStudent() throws Exception {
        // 学生角色应该被拒绝（只有TEACHER和ADMIN可以访问）
        mockMvc.perform(get("/api/v1/grading/tasks"))
                .andExpect(status().isForbidden());
    }
}
