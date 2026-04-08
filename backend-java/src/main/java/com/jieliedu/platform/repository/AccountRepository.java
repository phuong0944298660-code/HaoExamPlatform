package com.jieliedu.platform.repository;

import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {

    @Query("SELECT a FROM Account a WHERE a.username = :username AND a.isDeleted = false")
    Optional<Account> findByUsername(@Param("username") String username);

    Optional<Account> findByIdentityNo(String identityNo);

    Optional<Account> findByUsernameAndIsDeletedFalse(String username);

    Optional<Account> findByIdentityNoAndIsDeletedFalse(String identityNo);

    @Query("SELECT a FROM Account a WHERE (a.username = :account OR a.identityNo = :account) AND a.isDeleted = false")
    Optional<Account> findByLoginAccount(@Param("account") String account);

    Page<Account> findByAccountTypeAndIsDeletedFalse(AccountType accountType, Pageable pageable);

    Page<Account> findByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType accountType, GradeGroup gradeGroup, Pageable pageable);

    List<Account> findByAccountTypeAndGradeGroupAndIsDeletedFalseOrderByIdDesc(AccountType accountType, GradeGroup gradeGroup);

    long countByAccountTypeAndIsDeletedFalse(AccountType accountType);

    long countByAccountTypeAndGradeGroupAndIsDeletedFalse(AccountType accountType, GradeGroup gradeGroup);

    @Query("SELECT MAX(a.id) FROM Account a WHERE a.accountType = :type AND a.gradeGroup = :group")
    Optional<Integer> findMaxIdByAccountTypeAndGradeGroup(@Param("type") AccountType type, @Param("group") GradeGroup group);

    Page<Account> findByIsDeletedFalse(Pageable pageable);

    @Query("SELECT a FROM Account a WHERE a.isDeleted = false " +
           "AND (:type IS NULL OR a.accountType = :type) " +
           "AND (:group IS NULL OR a.gradeGroup = :group) " +
           "AND (:isActivated IS NULL OR a.isActivated = :isActivated) " +
           "AND (:role IS NULL OR a.role = :role) " +
           "AND (:school IS NULL OR a.school = :school) " +
           "AND (:keyword IS NULL OR a.username LIKE %:keyword% OR a.name LIKE %:keyword%)")
    Page<Account> search(
            @Param("type") AccountType type,
            @Param("group") GradeGroup group,
            @Param("isActivated") Boolean isActivated,
            @Param("role") String role,
            @Param("school") String school,
            @Param("keyword") String keyword,
            Pageable pageable);

    boolean existsByIdentityNoAndIsDeletedFalse(String identityNo);

    java.util.List<Account> findByClassIdAndIsDeletedFalse(Integer classId);

    @Query("SELECT DISTINCT a.school FROM Account a WHERE a.school IS NOT NULL AND a.school != ''")
    java.util.List<String> findAllSchools();
}
