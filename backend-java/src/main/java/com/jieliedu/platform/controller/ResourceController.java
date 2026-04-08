package com.jieliedu.platform.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jieliedu.platform.dto.response.PageResult;
import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.entity.Resource;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.repository.ActivationCodeRepository;
import com.jieliedu.platform.repository.ActivationPlanRepository;
import com.jieliedu.platform.repository.ResourceRepository;
import com.jieliedu.platform.security.CurrentUser;
import com.jieliedu.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Collections;
import java.util.List;

/**
 * 资源管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resourceRepository;
    private final AccountRepository accountRepository;
    private final ActivationCodeRepository activationCodeRepository;
    private final ActivationPlanRepository activationPlanRepository;
    private final ObjectMapper objectMapper;

    /**
     * 资源列表
     * 注意：学生角色(STUDENT)无权访问资源列表
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<?> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentUser UserPrincipal user) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));

        // ADMIN can see all resources
        if (user != null && user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            Page<Resource> result = resourceRepository.findByIsDeletedFalse(pageable);
            return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
        }

        // TEACHER: filter by activation plan resources
        if (user != null) {
            Account account = accountRepository.findById(user.getId()).orElse(null);
            if (account != null) {
                List<Integer> resourceIds = resolveAccessibleResourceIds(account);
                if (!resourceIds.isEmpty()) {
                    Page<Resource> result = resourceRepository.findByIdInAndIsDeletedFalse(resourceIds, pageable);
                    return Result.success(PageResult.of(result.getContent(), result.getTotalElements(), page, size));
                }
            }
            // If no account or no resources associated, return empty page
            return Result.success(PageResult.of(Collections.emptyList(), 0L, page, size));
        }

        // No user, return empty
        return Result.success(PageResult.of(Collections.emptyList(), 0L, page, size));
    }

    private List<Integer> resolveAccessibleResourceIds(Account account) {
        if (account.getActivationCodeId() == null) {
            return Collections.emptyList();
        }
        return activationCodeRepository.findById(account.getActivationCodeId())
                .map(code -> {
                    if (code.getPlanId() == null) return Collections.<Integer>emptyList();
                    return activationPlanRepository.findByIdAndIsDeletedFalse(code.getPlanId())
                            .map(plan -> {
                                String resourceIdsJson = plan.getResourceIds();
                                if (resourceIdsJson == null || resourceIdsJson.isBlank()) {
                                    return Collections.<Integer>emptyList();
                                }
                                try {
                                    return objectMapper.readValue(resourceIdsJson, new TypeReference<List<Integer>>() {});
                                } catch (Exception e) {
                                    log.warn("解析 resourceIds JSON 失败: {}", resourceIdsJson, e);
                                    return Collections.<Integer>emptyList();
                                }
                            })
                            .orElse(Collections.emptyList());
                })
                .orElse(Collections.emptyList());
    }

    /**
     * 创建/上传资源 (由管理端直接调用或通过上传组件)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> create(@RequestBody Resource resource) {
        log.info("Creating resource: {}", resource.getName());
        resource.setIsDeleted(false);
        resourceRepository.save(resource);
        return Result.success(resource);
    }

    /**
     * 兼容性上传接口 (针对 subagent 模拟 of multipart/form-data)
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> upload(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        log.info("Uploading file: {}", file.getOriginalFilename());
        Resource resource = new Resource();
        resource.setName(file.getOriginalFilename());
        resource.setFileType(file.getContentType());
        resource.setFilePath("/uploads/" + file.getOriginalFilename());
        resource.setIsDeleted(false);
        resourceRepository.save(resource);
        return Result.success(resource);
    }
}
