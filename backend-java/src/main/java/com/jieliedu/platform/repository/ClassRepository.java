package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.SysClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<SysClass, Integer> {
    List<SysClass> findByTeacherIdAndIsDeletedFalse(Integer teacherId);
    List<SysClass> findBySchoolNameAndIsDeletedFalse(String schoolName);
}
