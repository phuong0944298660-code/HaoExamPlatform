package com.jieliedu.platform.controller;

import com.jieliedu.platform.dto.response.Result;
import com.jieliedu.platform.entity.SysClass;
import com.jieliedu.platform.security.UserPrincipal;
import com.jieliedu.platform.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 班级控制器
 */
@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> listClasses() {
        UserPrincipal user = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            return Result.success(classService.listBySchool(null)); // 管理员看所有（或根据需要传参）
        }
        return Result.success(classService.listByTeacher(user.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public Result<?> createClass(@RequestBody SysClass sysClass) {
        UserPrincipal user = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        sysClass.setTeacherId(user.getId());
        sysClass.setSchoolName(user.getSchool());
        return Result.success(classService.saveClass(sysClass));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> getClassById(@PathVariable Integer id) {
        return Result.success(classService.findById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> deleteClass(@PathVariable Integer id) {
        classService.deleteClass(id);
        return Result.success("删除成功");
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Result<?> getClassStudents(@PathVariable Integer id) {
        return Result.success(classService.findClassStudents(id));
    }

    @PostMapping("/{id}/students")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<?> addStudent(@PathVariable Integer id, @RequestBody Map<String, Integer> request) {
        classService.addStudentToClass(id, request.get("student_id"));
        return Result.success("添加成功");
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<?> removeStudent(@PathVariable Integer id, @PathVariable Integer studentId) {
        classService.removeStudentFromClass(id, studentId);
        return Result.success("移除成功");
    }

    @GetMapping("/{id}/available-students")
    @PreAuthorize("hasRole('TEACHER')")
    public Result<?> getAvailableStudents(@PathVariable Integer id) {
        UserPrincipal user = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return Result.success(classService.findAvailableStudents(user.getSchool(), id));
    }
}
