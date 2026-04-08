package com.jieliedu.platform.config;

import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.entity.SysMenu;
import com.jieliedu.platform.entity.SysRole;
import com.jieliedu.platform.enums.AccountType;
import com.jieliedu.platform.enums.GradeGroup;
import com.jieliedu.platform.repository.AccountRepository;
import com.jieliedu.platform.repository.QuestionBankRepository;
import com.jieliedu.platform.repository.SysMenuRepository;
import com.jieliedu.platform.repository.SysRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 数据库初始化器 - 在应用启动时确保基础数据存在
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final SysMenuRepository menuRepository;
    private final SysRoleRepository roleRepository;
    private final QuestionBankRepository questionBankRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("📦 正在检查并初始化系统基础数据...");
        
        // 1. 初始化系统角色 (必须在菜单和账号之前)
        initializeRoles();

        // 2. 初始化管理员账号
        initializeAdminAccount();

        // 3. 初始化系统菜单 (先清空后同步)
        menuRepository.deleteAll();
        initializeMenus();
        
        // 4. 初始化测试业务数据 (老师、学生、题库等)
        seedTestData();

        log.info("🚀 系统基础数据初始化完成");
    }

    private void initializeAdminAccount() {
        if (accountRepository.findByUsername("admin").isEmpty()) {
            log.info("👤 正在创建默认管理员账号: admin/admin123");
            Account admin = new Account();
            admin.setUsername("admin");
            admin.setHashedPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setAccountType(AccountType.SYSTEM);
            admin.setGradeGroup(GradeGroup.ALL);
            admin.setName("超级管理员");
            admin.setIsActivated(true);
            admin.setIsActive(true);
            accountRepository.save(admin);
            log.info("✅ 默认管理员账号创建成功");
        }
    }

    private void initializeRoles() {
        log.info("🛡️ 正在同步角色数据...");
        saveRole("超级管理员", "admin", "拥有所有系统权限");
        saveRole("教师", "teacher", "拥有教学相关权限");
        saveRole("学生", "student", "拥有学习和考试权限");
    }

    private void saveRole(String name, String key, String remark) {
        SysRole role = roleRepository.findByRoleKey(key).orElse(null);
        if (role == null) {
            role = new SysRole();
            role.setRoleName(name);
            role.setRoleKey(key);
            role.setRemark(remark);
            roleRepository.save(role);
            log.info("  ➕ 创建新角色: {}", name);
        }
    }

    private void seedTestData() {
        // 创建测试教师
        if (accountRepository.findByUsername("teacher1").isEmpty()) {
            Account t = new Account();
            t.setName("张老师");
            t.setUsername("teacher1");
            t.setHashedPassword(passwordEncoder.encode("123456"));
            t.setRole("TEACHER");
            t.setAccountType(AccountType.SYSTEM);
            t.setGradeGroup(GradeGroup.MIDDLE);
            t.setIsActivated(true);
            t.setIsActive(true);
            accountRepository.save(t);
        }

        // 创建测试学生
        if (accountRepository.findByUsername("student1").isEmpty()) {
            Account s = new Account();
            s.setName("李小华");
            s.setUsername("student1");
            s.setHashedPassword(passwordEncoder.encode("123456"));
            s.setRole("STUDENT");
            s.setAccountType(AccountType.PRACTICE);
            s.setGradeGroup(GradeGroup.PRIMARY);
            s.setIsActivated(true);
            s.setIsActive(true);
            accountRepository.save(s);
        }

        // 创建测试题库
        if (questionBankRepository.count() == 0) {
            com.jieliedu.platform.entity.QuestionBank bank = new com.jieliedu.platform.entity.QuestionBank();
            bank.setName("2024接力奥数模拟题库");
            bank.setGradeGroup(GradeGroup.PRIMARY);
            bank.setStatus("ACTIVE");
            bank.setCreatedBy(1);
            questionBankRepository.save(bank);
        }
    }

    private void initializeMenus() {
        log.info("📋 正在全量同步菜单数据...");
        
        // 1. 清空旧数据关系，防止 ID 错乱
        SysRole adminRole = roleRepository.findByRoleKey("admin").orElse(null);
        if (adminRole != null) {
            adminRole.setMenus(new java.util.HashSet<>());
            roleRepository.save(adminRole);
        }
        menuRepository.deleteAll();
        
        if (adminRole == null) return;
        
        // 1. 控制台 (Top level)
        syncMenuWithRole(adminRole, 0L, "管理控制台", "C", "/", "admin/Dashboard", "DashboardOutlined", 1);

        // 2. 账号管理
        SysMenu accountDir = syncMenu(0L, "账号管理", "M", "/accounts", "Layout", "TeamOutlined", 10);
        syncMenuWithRole(adminRole, accountDir.getId(), "账号列表", "C", "/accounts/list", "admin/AccountManager", "UserOutlined", 1);
        
        // 3. 激活授权
        SysMenu activationDir = syncMenu(0L, "激活授权", "M", "/activation", "Layout", "KeyOutlined", 20);
        syncMenuWithRole(adminRole, activationDir.getId(), "激活码管理", "C", "/accounts/activation", "admin/ActivationCodes", "BarcodeOutlined", 1);
        syncMenuWithRole(adminRole, activationDir.getId(), "激活计划", "C", "/accounts/plans", "admin/ActivationPlans", "CalendarOutlined", 2);

        // 4. 题库系统
        SysMenu questionDir = syncMenu(0L, "题库系统", "M", "/questions", "Layout", "DatabaseOutlined", 30);
        syncMenuWithRole(adminRole, questionDir.getId(), "题库管理", "C", "/questions/banks", "admin/QuestionBankList", "SnippetsOutlined", 1);

        // 5. 组卷考试
        SysMenu examGroupDir = syncMenu(0L, "考试系统", "M", "/exam-system", "Layout", "FormOutlined", 40);
        syncMenuWithRole(adminRole, examGroupDir.getId(), "试卷列表", "C", "/papers/list", "admin/PaperManager", "CopyOutlined", 1);
        syncMenuWithRole(adminRole, examGroupDir.getId(), "考试管理", "C", "/exams/list", "admin/ExamManager", "ReconciliationOutlined", 2);
        syncMenuWithRole(adminRole, examGroupDir.getId(), "成绩统计", "C", "/scores/list", "admin/ScoreManager", "BarChartOutlined", 3);

        // 6. 系统管理
        SysMenu systemDir = syncMenu(0L, "系统管理", "M", "/system", "Layout", "SettingOutlined", 100);
        
        SysMenu userMenu = syncMenuWithRole(adminRole, systemDir.getId(), "用户管理", "C", "/system/users", "system/users/index", "ContactsOutlined", 1);
        syncMenuWithRole(adminRole, userMenu.getId(), "用户查询", "F", null, null, null, 1, "system:user:query");
        syncMenuWithRole(adminRole, userMenu.getId(), "用户新增", "F", null, null, null, 2, "system:user:add");
        syncMenuWithRole(adminRole, userMenu.getId(), "用户修改", "F", null, null, null, 3, "system:user:edit");
        syncMenuWithRole(adminRole, userMenu.getId(), "用户删除", "F", null, null, null, 4, "system:user:remove");

        SysMenu roleMenu = syncMenuWithRole(adminRole, systemDir.getId(), "角色管理", "C", "/system/roles", "system/roles/index", "SafetyOutlined", 2);
        syncMenuWithRole(adminRole, roleMenu.getId(), "角色查询", "F", null, null, null, 1, "system:role:query");
        syncMenuWithRole(adminRole, roleMenu.getId(), "角色新增", "F", null, null, null, 2, "system:role:add");
        syncMenuWithRole(adminRole, roleMenu.getId(), "角色修改", "F", null, null, null, 3, "system:role:edit");
        syncMenuWithRole(adminRole, roleMenu.getId(), "角色删除", "F", null, null, null, 4, "system:role:remove");

        SysMenu menuMenu = syncMenuWithRole(adminRole, systemDir.getId(), "菜单管理", "C", "/system/menus", "system/menus/index", "MenuOutlined", 3);
        syncMenuWithRole(adminRole, menuMenu.getId(), "菜单查询", "F", null, null, null, 1, "system:menu:query");
        syncMenuWithRole(adminRole, menuMenu.getId(), "菜单新增", "F", null, null, null, 2, "system:menu:add");
        syncMenuWithRole(adminRole, menuMenu.getId(), "菜单修改", "F", null, null, null, 3, "system:menu:edit");
        syncMenuWithRole(adminRole, menuMenu.getId(), "菜单删除", "F", null, null, null, 4, "system:menu:remove");

        syncMenuWithRole(adminRole, systemDir.getId(), "部门管理", "C", "/system/depts", "system/depts/index", "ClusterOutlined", 4);

        // 7. 赛事反馈 (置顶或置底)
        syncMenuWithRole(adminRole, 0L, "赛事反馈", "C", "/feedbacks/list", "admin/FeedbackManager", "MessageOutlined", 90);

        log.info("✅ 菜单初始化完成");
    }

    private SysMenu syncMenuWithRole(SysRole role, Long parentId, String name, String type, String path, String component, String icon, int order, String perms) {
        SysMenu menu = syncMenu(parentId, name, type, path, component, icon, order, perms);
        if (role.getMenus() == null) role.setMenus(new java.util.HashSet<>());
        if (role.getMenus().stream().noneMatch(m -> m.getId().equals(menu.getId()))) {
            role.getMenus().add(menu);
            roleRepository.save(role);
        }
        return menu;
    }

    private SysMenu syncMenuWithRole(SysRole role, Long parentId, String name, String type, String path, String component, String icon, int order) {
        return syncMenuWithRole(role, parentId, name, type, path, component, icon, order, null);
    }

    private SysMenu syncMenu(Long parentId, String name, String type, String path, String component, String icon, int order, String perms) {
        SysMenu menu = menuRepository.findByMenuName(name).orElse(new SysMenu());
        menu.setMenuName(name);
        menu.setParentId(parentId);
        menu.setMenuType(type);
        menu.setPath(path);
        menu.setComponent(component);
        menu.setIcon(icon);
        menu.setOrderNum(order);
        menu.setPerms(perms);
        menu.setStatus(1);
        menu.setVisible(1);
        return menuRepository.save(menu);
    }

    private SysMenu syncMenu(Long parentId, String name, String type, String path, String component, String icon, int order) {
        return syncMenu(parentId, name, type, path, component, icon, order, null);
    }
}
