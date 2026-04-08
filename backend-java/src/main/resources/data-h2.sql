-- ============================================================
-- H2内存数据库初始化数据
-- ============================================================

-- 插入默认管理员账户 (密码: admin123, BCrypt加密)
-- 注意: 实际密码需要使用BCrypt加密，这里只是占位符
INSERT INTO accounts (id, account_type, grade_group, role, identity_no, username, hashed_password, is_activated, name, school, is_active, created_at, updated_at, is_deleted, version)
VALUES (1, 'PRACTICE', 'OTHER', 'admin', 'admin', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqzJdmQxJZrBzFQYlHJKj9bW4J7yG', true, '系统管理员', '系统', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 1);

-- 插入测试学生账户 (密码: student123)
INSERT INTO accounts (id, account_type, grade_group, role, identity_no, username, hashed_password, is_activated, name, school, is_active, created_at, updated_at, is_deleted, version)
VALUES (2, 'PRACTICE', 'JUNIOR', 'student', 'S001', 'student1', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqzJdmQxJZrBzFQYlHJKj9bW4J7yG', true, '测试学生', '测试学校', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 1);

-- 插入测试教师账户 (密码: teacher123)
INSERT INTO accounts (id, account_type, grade_group, role, identity_no, username, hashed_password, is_activated, name, school, is_active, created_at, updated_at, is_deleted, version)
VALUES (3, 'PRACTICE', 'OTHER', 'teacher', 'T001', 'teacher1', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqzJdmQxJZrBzFQYlHJKj9bW4J7yG', true, '测试教师', '测试学校', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 1);

-- 插入示例题库
INSERT INTO question_banks (id, name, grade_group, owner_id, is_active, created_at, updated_at, is_deleted, version)
VALUES (1, '数学基础题库', 'JUNIOR', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 1);

INSERT INTO question_banks (id, name, grade_group, owner_id, is_active, created_at, updated_at, is_deleted, version)
VALUES (2, '英语词汇题库', 'JUNIOR', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 1);
