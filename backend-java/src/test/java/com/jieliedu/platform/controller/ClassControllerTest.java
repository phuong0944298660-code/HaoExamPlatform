package com.jieliedu.platform.controller;

import com.jieliedu.platform.service.ClassService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ClassController单元测试
 */
@SpringBootTest
@ActiveProfiles("test")
public class ClassControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @MockBean
    private ClassService classService;

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
    void testListClassesEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/classes"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void testCreateClassEndpoint() throws Exception {
        String classJson = "{\"name\":\"测试班级\",\"gradeGroup\":\"PRIMARY\",\"maxStudents\":50}";
        mockMvc.perform(post("/api/v1/classes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(classJson))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetClassDetailEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/classes/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void testListClassStudentsEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/classes/1/students"))
                .andExpect(status().isOk());
    }

    @Test
    void testListClassesWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/classes"))
                .andExpect(status().isUnauthorized());
    }
}
