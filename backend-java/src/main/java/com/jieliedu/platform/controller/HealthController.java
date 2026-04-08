package com.jieliedu.platform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康检查控制器
 */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public String health() {
        return "OK";
    }
}
