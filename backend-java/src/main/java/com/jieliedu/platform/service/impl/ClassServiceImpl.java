package com.jieliedu.platform.service.impl;

import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.entity.SysClass;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.repository.ClassRepository;
import com.jieliedu.platform.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;
    private final AccountRepository accountRepository;

    @Override
    public List<SysClass> listByTeacher(Integer teacherId) {
        return classRepository.findByTeacherIdAndIsDeletedFalse(teacherId);
    }

    @Override
    public List<SysClass> listBySchool(String schoolName) {
        return classRepository.findBySchoolNameAndIsDeletedFalse(schoolName);
    }

    @Override
    public SysClass findById(Integer id) {
        return classRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public SysClass saveClass(SysClass sysClass) {
        return classRepository.save(sysClass);
    }

    @Override
    @Transactional
    public void deleteClass(Integer id) {
        SysClass sysClass = classRepository.findById(id).orElse(null);
        if (sysClass != null) {
            sysClass.setIsDeleted(true);
            classRepository.save(sysClass);
            
            // 将班级下的学生解绑
            List<Account> students = accountRepository.findByClassIdAndIsDeletedFalse(id);
            for (Account s : students) {
                s.setClassId(null);
                accountRepository.save(s);
            }
        }
    }

    @Override
    public List<Account> findClassStudents(Integer classId) {
        return accountRepository.findByClassIdAndIsDeletedFalse(classId);
    }

    @Override
    @Transactional
    public void addStudentToClass(Integer classId, Integer studentId) {
        Account student = accountRepository.findById(studentId).orElse(null);
        if (student != null) {
            student.setClassId(classId);
            accountRepository.save(student);
            updateClassStudentCount(classId);
        }
    }

    @Override
    @Transactional
    public void removeStudentFromClass(Integer classId, Integer studentId) {
        Account student = accountRepository.findById(studentId).orElse(null);
        if (student != null && classId.equals(student.getClassId())) {
            student.setClassId(null);
            accountRepository.save(student);
            updateClassStudentCount(classId);
        }
    }

    @Override
    public List<Account> findAvailableStudents(String schoolName, Integer classId) {
        // 获取同一学校下且未分配班级的学生，或者就在当前班的学生也会列出来做可选
        // 这里简化：获取同一学校下，角色为 STUDENT 且没有班级的学生
        // 由于 AccountRepository 还没实现 findBySchoolAndRoleAndClassIdIsNull，我们用 Java Filter 演示
        // 实际上生产环境应用 Query 实现
        return accountRepository.findAll().stream()
                .filter(a -> "student".equalsIgnoreCase(a.getRole()) 
                        && !a.getIsDeleted() 
                        && schoolName != null && schoolName.equals(a.getSchool())
                        && a.getClassId() == null)
                .collect(Collectors.toList());
    }

    private void updateClassStudentCount(Integer classId) {
        SysClass sysClass = classRepository.findById(classId).orElse(null);
        if (sysClass != null) {
            long count = accountRepository.findByClassIdAndIsDeletedFalse(classId).size();
            sysClass.setStudentCount((int) count);
            classRepository.save(sysClass);
        }
    }
}
