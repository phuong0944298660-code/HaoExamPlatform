package com.jieliedu.platform.service;

import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.entity.SysClass;

import java.util.List;

/**
 * 班级服务接口
 */
public interface ClassService {
    List<SysClass> listByTeacher(Integer teacherId);
    List<SysClass> listBySchool(String schoolName);
    SysClass findById(Integer id);
    SysClass saveClass(SysClass sysClass);
    void deleteClass(Integer id);
    
    // 学生管理
    List<Account> findClassStudents(Integer classId);
    void addStudentToClass(Integer classId, Integer studentId);
    void removeStudentFromClass(Integer classId, Integer studentId);
    List<Account> findAvailableStudents(String schoolName, Integer classId);
}
