package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.ActivationCode;
import com.jieliedu.platform.entity.ActivationPlan;
import com.jieliedu.platform.enums.ActivationCodeStatus;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.ActivationCodeRepository;
import com.jieliedu.platform.repository.ActivationPlanRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 激活码管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/activations")
@RequiredArgsConstructor
public class ActivationController {

    private final ActivationPlanRepository activationPlanRepository;
    private final ActivationCodeRepository activationCodeRepository;

    /**
     * 激活计划列表
     */
    @GetMapping("/admin/plans")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> listPlans(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<ActivationPlan> result = activationPlanRepository.findByIsDeletedFalse(pageable);
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 创建激活计划
     */
    @PostMapping("/admin/plans")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> createPlan(@RequestBody ActivationPlan plan, @CurrentUser UserPrincipal user) {
        System.out.println("Creating plan: " + plan);
        
        // Ensure default values for required numeric fields if not provided
        if (plan.getValidityDays() == null) {
            plan.setValidityDays(365); // Default 1 year
        }
        if (plan.getMaxActivations() == null || plan.getMaxActivations() == 0) {
            plan.setMaxActivations(1);
        }
        
        plan.setCreatedBy(user != null ? user.getId() : 1);
        plan.setTotalGenerated(0);
        plan.setTotalUsed(0);
        plan.setIsDeleted(false);

        System.out.println("DEBUG before save: " + plan.getName() + ", validity=" + plan.getValidityDays() + ", grade=" + plan.getTargetGradeGroup());
        
        try {
            activationPlanRepository.save(plan);
            return Result.success(plan);
        } catch (Exception e) {
            log.error("创建激活计划失败! 对象: {}, 错误: {}", plan, e.getMessage());
            return Result.error("创建失败: " + e.getMessage() + ". 请检查数据库是否已同步资源ID字段。");
        }
    }

    /**
     * 更新激活计划
     */
    @PutMapping("/admin/plans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> updatePlan(@PathVariable Integer id, @RequestBody ActivationPlan updateData) {
        ActivationPlan plan = activationPlanRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("激活计划不存在"));
        
        if (updateData.getName() != null) plan.setName(updateData.getName());
        if (updateData.getTargetRole() != null) plan.setTargetRole(updateData.getTargetRole());
        if (updateData.getTargetGradeGroup() != null) plan.setTargetGradeGroup(updateData.getTargetGradeGroup());
        if (updateData.getValidityDays() != null) plan.setValidityDays(updateData.getValidityDays());
        if (updateData.getPrice() != null) plan.setPrice(updateData.getPrice());
        if (updateData.getDescription() != null) plan.setDescription(updateData.getDescription());
        if (updateData.getPermissions() != null) plan.setPermissions(updateData.getPermissions());
        if (updateData.getIsOnlineSale() != null) plan.setIsOnlineSale(updateData.getIsOnlineSale());
        if (updateData.getMaxActivations() != null) plan.setMaxActivations(updateData.getMaxActivations());
        if (updateData.getQuestionBankIds() != null) plan.setQuestionBankIds(updateData.getQuestionBankIds());
        if (updateData.getResourceIds() != null) plan.setResourceIds(updateData.getResourceIds());

        activationPlanRepository.save(plan);
        return Result.success(plan);
    }

    /**
     * 更新状态
     */
    @PatchMapping("/admin/plans/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> toggleStatus(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        ActivationPlan plan = activationPlanRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("激活计划不存在"));
        
        Boolean isActive = (Boolean) request.get("is_active");
        if (isActive != null) {
            plan.setIsOnlineSale(isActive);
        }
        activationPlanRepository.save(plan);
        return Result.success(plan);
    }

    /**
     * 删除激活计划
     */
    @DeleteMapping("/admin/plans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> deletePlan(@PathVariable Integer id) {
        ActivationPlan plan = activationPlanRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("激活计划不存在"));
        plan.setIsDeleted(true);
        activationPlanRepository.save(plan);
        return Result.success();
    }

    /**
     * 批量生成激活码
     */
    @PostMapping("/admin/codes/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> batchGenerateCodes(@RequestBody Map<String, Object> request, @CurrentUser UserPrincipal user) {
        System.out.println("Batch generating codes with request: " + request);
        
        Integer planId = parseInteger(request.get("plan_id") != null ? request.get("plan_id") : request.get("planId"));
        Integer count = parseInteger(request.get("count"));
        String batchNo = (String) (request.get("batch_no") != null ? request.get("batch_no") : request.get("batchNo"));

        if (planId == null || count == null || count <= 0) {
            return Result.error("参数错误：plan_id " + planId + " 和 count " + count + " 为必填且必须大于0");
        }
        if (count > 500) {
            return Result.error("单次最多生成500个激活码");
        }

        ActivationPlan plan = activationPlanRepository.findByIdAndIsDeletedFalse(planId)
                .orElseThrow(() -> new RuntimeException("激活计划不存在"));

        List<ActivationCode> codes = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ActivationCode code = new ActivationCode();
            code.setCode(generateCode());
            code.setPlanId(planId);
            code.setGradeGroup(plan.getTargetGradeGroup() != null ? plan.getTargetGradeGroup() : GradeGroup.PRIMARY);
            code.setUserRole(plan.getTargetRole() != null ? plan.getTargetRole() : "student");
            code.setStatus(ActivationCodeStatus.UNUSED);
            code.setSource((String) request.getOrDefault("source", "offline"));
            code.setBatchNo(batchNo);
            code.setCreatedBy(user != null ? user.getId() : 1);
            codes.add(code);
        }
        
        System.out.println("Saving " + codes.size() + " codes...");
        activationCodeRepository.saveAll(codes);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("count", codes.size());
        data.put("batchNo", batchNo);
        data.put("codes", codes.stream().map(ActivationCode::getCode).toList());
        return Result.success(data);
    }

    private Integer parseInteger(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).intValue();
        if (obj instanceof String) {
            try {
                return Integer.parseInt((String) obj);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 激活码列表
     */
    @GetMapping("/admin/codes")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> listCodes(
            @RequestParam(required = false) Integer planId,
            @RequestParam(required = false) ActivationCodeStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<ActivationCode> result;
        if (planId != null) {
            result = activationCodeRepository.findByPlanIdAndIsDeletedFalse(planId, pageable);
        } else if (status != null) {
            result = activationCodeRepository.findByStatusAndIsDeletedFalse(status, pageable);
        } else {
            result = activationCodeRepository.findByIsDeletedFalse(pageable);
        }
        return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
    }

    /**
     * 生成激活码格式: XXXX-XXXX-XXXX-XXXX
     */
    private String generateCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 4; i++) {
            if (i > 0) sb.append("-");
            for (int j = 0; j < 4; j++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
        }
        return sb.toString();
    }
}
