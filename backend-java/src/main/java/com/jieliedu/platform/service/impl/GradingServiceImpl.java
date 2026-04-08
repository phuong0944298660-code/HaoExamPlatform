package com.jieliedu.platform.service.impl;

import com.jieliedu.platform.service.GradingService;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class GradingServiceImpl implements GradingService {
    @Override
    public List<?> getPendingTasks() {
        return Collections.emptyList();
    }
}
