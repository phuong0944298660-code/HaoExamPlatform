package com.jieliedu.platform.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Controller注册检查测试
 * 验证所有Controller是否正确被Spring扫描和注册
 */
@SpringBootTest
public class ControllerRegistrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    /**
     * 期望注册的所有Controller类列表
     */
    private static final List<Class<?>> EXPECTED_CONTROLLERS = Arrays.asList(
            AccountController.class,
            ActivationController.class,
            AuthController.class,
            ClassController.class,
            DashboardController.class,
            ExamController.class,
            ExamEngineController.class,
            FeedbackController.class,
            GradingController.class,
            HealthController.class,
            PaperController.class,
            QuestionBankController.class,
            QuestionController.class,
            ResourceController.class,
            ScoreController.class,
            SystemController.class,
            UserController.class
    );

    @Test
    void testAllControllersAreRegistered() {
        // 获取所有带有@RestController注解的Bean
        Map<String, Object> controllers = applicationContext.getBeansWithAnnotation(RestController.class);
        
        System.out.println("=== 已注册的Controller ===");
        controllers.forEach((name, bean) -> {
            System.out.println("Bean名称: " + name + ", 类名: " + bean.getClass().getName());
        });
        
        // 验证期望的Controller都已注册
        for (Class<?> expectedController : EXPECTED_CONTROLLERS) {
            Object bean = applicationContext.getBean(expectedController);
            assertNotNull(bean, 
                "Controller未注册: " + expectedController.getSimpleName());
            
            // 验证是否带有@RestController注解
            assertTrue(bean.getClass().isAnnotationPresent(RestController.class),
                expectedController.getSimpleName() + " 应该带有@RestController注解");
        }
        
        System.out.println("\n✅ 所有 " + EXPECTED_CONTROLLERS.size() + " 个Controller已成功注册");
    }

    @Test
    void testControllerCount() {
        Map<String, Object> controllers = applicationContext.getBeansWithAnnotation(RestController.class);
        
        // 过滤掉Spring代理类（避免重复计数）
        long uniqueControllerCount = controllers.values().stream()
                .map(Object::getClass)
                .filter(clazz -> clazz.getPackage().getName().startsWith("com.jieliedu.platform"))
                .distinct()
                .count();
        
        System.out.println("注册的Controller数量: " + uniqueControllerCount);
        assertTrue(uniqueControllerCount >= EXPECTED_CONTROLLERS.size(),
            "注册的Controller数量应至少为 " + EXPECTED_CONTROLLERS.size());
    }

    @Test
    void testGradingControllerSpecifically() {
        // 专门测试GradingController
        GradingController gradingController = applicationContext.getBean(GradingController.class);
        assertNotNull(gradingController, "GradingController必须被注册");
        
        // 验证请求映射
        var requestMapping = GradingController.class.getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);
        assertNotNull(requestMapping, "GradingController应该有@RequestMapping注解");
        assertEquals("/grading", requestMapping.value()[0], "GradingController的基础路径应为/grading");
    }

    @Test
    void testAccountControllerEndpoints() {
        // 专门测试AccountController及其新方法
        AccountController accountController = applicationContext.getBean(AccountController.class);
        assertNotNull(accountController, "AccountController必须被注册");
        
        // 检查refreshToken方法是否存在
        boolean hasRefreshMethod = Arrays.stream(AccountController.class.getMethods())
                .anyMatch(method -> method.getName().equals("refreshToken"));
        assertTrue(hasRefreshMethod, "AccountController应该有refreshToken方法");
        
        // 检查heartbeat方法是否存在
        boolean hasHeartbeatMethod = Arrays.stream(AccountController.class.getMethods())
                .anyMatch(method -> method.getName().equals("heartbeat"));
        assertTrue(hasHeartbeatMethod, "AccountController应该有heartbeat方法");
    }
}
