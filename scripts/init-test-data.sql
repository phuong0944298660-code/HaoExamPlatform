-- 接力教育智慧云平台 - 测试数据初始化脚本

-- 插入测试管理员
INSERT INTO accounts (account_type, username, hashed_password, role, is_activated, name, created_at)
VALUES ('system', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'admin', true, '系统管理员', NOW())
ON DUPLICATE KEY UPDATE hashed_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK';

-- 插入测试教师
INSERT INTO accounts (account_type, username, hashed_password, role, grade_group, is_activated, name, created_at)
VALUES ('practice', 'teacher_primary', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'teacher', 'primary', true, '小学教师', NOW())
ON DUPLICATE KEY UPDATE hashed_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK';

-- 插入测试学生
INSERT INTO accounts (account_type, identity_no, hashed_password, grade_group, is_activated, name, school, created_at)
VALUES ('exam', '450102201501011234', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK', 'primary', true, '张小北', '南宁市第一小学', NOW())
ON DUPLICATE KEY UPDATE hashed_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IiK';

-- 插入测试激活码
INSERT INTO activation_codes (code, grade_group, user_role, is_used, created_at) VALUES
('ACTIVATE_PT_001', 'primary', 'teacher', false, NOW()),
('ACTIVATE_PS_001', 'primary', 'student', false, NOW())
ON DUPLICATE KEY UPDATE code = code;
