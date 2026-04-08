package com.jieliedu.platform.dto.request;

import com.jieliedu.platform.enums.GradeGroup;
import lombok.Data;

@Data
public class BatchGeneratePracticeRequest {
    private Integer count;
    private GradeGroup grade_group;
    private String initial_password;
}
