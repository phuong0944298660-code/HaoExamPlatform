-- =============================================================
-- 接力教育智慧云平台 - 数据库初始化脚本
-- 包含：基础表结构、初始数据、索引
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- 1. 用户与权限模块
-- =============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(64) NOT NULL COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT '密码（加密）',
  `real_name` VARCHAR(64) DEFAULT NULL COMMENT '真实姓名',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `email` VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知 1-男 2-女',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `user_type` TINYINT DEFAULT 1 COMMENT '用户类型：1-学生 2-教师 3-管理员',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(64) DEFAULT NULL COMMENT '最后登录IP',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_user_type` (`user_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` VARCHAR(64) NOT NULL COMMENT '角色名称',
  `role_code` VARCHAR(64) NOT NULL COMMENT '角色编码',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 权限表
CREATE TABLE IF NOT EXISTS `sys_permission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `permission_name` VARCHAR(64) NOT NULL COMMENT '权限名称',
  `permission_code` VARCHAR(128) NOT NULL COMMENT '权限编码',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父权限ID',
  `permission_type` TINYINT NOT NULL COMMENT '权限类型：1-菜单 2-按钮 3-接口',
  `path` VARCHAR(255) DEFAULT NULL COMMENT '路由路径/接口路径',
  `component` VARCHAR(255) DEFAULT NULL COMMENT '组件路径',
  `icon` VARCHAR(64) DEFAULT NULL COMMENT '图标',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_type` (`permission_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `sys_role_permission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` BIGINT NOT NULL COMMENT '角色ID',
  `permission_id` BIGINT NOT NULL COMMENT '权限ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- =============================================================
-- 2. 题库模块
-- =============================================================

-- 题目分类表
CREATE TABLE IF NOT EXISTS `question_category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `category_name` VARCHAR(128) NOT NULL COMMENT '分类名称',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父分类ID',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目分类表';

-- 题目表
CREATE TABLE IF NOT EXISTS `question` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '题目ID',
  `question_type` TINYINT NOT NULL COMMENT '题型：1-单选 2-多选 3-判断 4-填空 5-简答 6-编程',
  `category_id` BIGINT DEFAULT NULL COMMENT '分类ID',
  `content` TEXT NOT NULL COMMENT '题目内容',
  `options` JSON DEFAULT NULL COMMENT '选项（JSON格式）',
  `answer` TEXT NOT NULL COMMENT '答案',
  `analysis` TEXT DEFAULT NULL COMMENT '解析',
  `difficulty` TINYINT DEFAULT 2 COMMENT '难度：1-简单 2-中等 3-困难',
  `score` DECIMAL(5,2) DEFAULT 1.00 COMMENT '默认分值',
  `knowledge_points` JSON DEFAULT NULL COMMENT '知识点标签',
  `source` VARCHAR(255) DEFAULT NULL COMMENT '题目来源',
  `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`question_type`),
  KEY `idx_category` (`category_id`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_create_by` (`create_by`),
  FULLTEXT KEY `ft_content` (`content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';

-- =============================================================
-- 3. 试卷模块
-- =============================================================

-- 试卷表
CREATE TABLE IF NOT EXISTS `exam_paper` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `paper_name` VARCHAR(255) NOT NULL COMMENT '试卷名称',
  `paper_type` TINYINT NOT NULL COMMENT '试卷类型：1-练习 2-考试 3-作业',
  `category_id` BIGINT DEFAULT NULL COMMENT '分类ID',
  `description` TEXT DEFAULT NULL COMMENT '试卷描述',
  `total_score` DECIMAL(8,2) NOT NULL COMMENT '总分',
  `pass_score` DECIMAL(8,2) DEFAULT NULL COMMENT '及格分',
  `duration` INT DEFAULT NULL COMMENT '考试时长（分钟）',
  `question_count` INT NOT NULL DEFAULT 0 COMMENT '题目数量',
  `status` TINYINT DEFAULT 0 COMMENT '状态：0-草稿 1-已发布 2-已归档',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `create_by` BIGINT NOT NULL COMMENT '创建人ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`paper_type`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_by` (`create_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷表';

-- 试卷题目关联表
CREATE TABLE IF NOT EXISTS `exam_paper_question` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `paper_id` BIGINT NOT NULL COMMENT '试卷ID',
  `question_id` BIGINT NOT NULL COMMENT '题目ID',
  `question_order` INT NOT NULL COMMENT '题目序号',
  `score` DECIMAL(5,2) NOT NULL COMMENT '题目分值',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paper_order` (`paper_id`, `question_order`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷题目关联表';

-- =============================================================
-- 4. 考试与答题模块
-- =============================================================

-- 考试记录表
CREATE TABLE IF NOT EXISTS `exam_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `paper_id` BIGINT NOT NULL COMMENT '试卷ID',
  `user_id` BIGINT NOT NULL COMMENT '考生ID',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `submit_time` DATETIME DEFAULT NULL COMMENT '提交时间',
  `duration` INT DEFAULT NULL COMMENT '实际用时（秒）',
  `total_score` DECIMAL(8,2) DEFAULT NULL COMMENT '总分',
  `obtain_score` DECIMAL(8,2) DEFAULT NULL COMMENT '获得分数',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-进行中 1-已提交 2-已批改',
  `ip_address` VARCHAR(64) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` TEXT DEFAULT NULL COMMENT '浏览器信息',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paper_user` (`paper_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表';

-- 答题记录表
CREATE TABLE IF NOT EXISTS `exam_answer` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '答案ID',
  `record_id` BIGINT NOT NULL COMMENT '考试记录ID',
  `question_id` BIGINT NOT NULL COMMENT '题目ID',
  `user_answer` TEXT DEFAULT NULL COMMENT '用户答案',
  `is_correct` TINYINT DEFAULT NULL COMMENT '是否正确：0-错误 1-正确',
  `obtain_score` DECIMAL(5,2) DEFAULT NULL COMMENT '获得分数',
  `answer_time` DATETIME DEFAULT NULL COMMENT '答题时间',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_question` (`record_id`, `question_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';

-- =============================================================
-- 5. 系统配置与日志模块
-- =============================================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS `sys_config` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(128) NOT NULL COMMENT '配置键',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS `sys_operation_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` BIGINT DEFAULT NULL COMMENT '用户ID',
  `username` VARCHAR(64) DEFAULT NULL COMMENT '用户名',
  `operation` VARCHAR(128) NOT NULL COMMENT '操作描述',
  `method` VARCHAR(255) DEFAULT NULL COMMENT '请求方法',
  `request_url` VARCHAR(512) DEFAULT NULL COMMENT '请求URL',
  `request_params` TEXT DEFAULT NULL COMMENT '请求参数',
  `response_data` TEXT DEFAULT NULL COMMENT '响应数据',
  `ip_address` VARCHAR(64) DEFAULT NULL COMMENT 'IP地址',
  `execution_time` INT DEFAULT NULL COMMENT '执行时长（毫秒）',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-失败 1-成功',
  `error_msg` TEXT DEFAULT NULL COMMENT '错误信息',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =============================================================
-- 6. 初始化数据
-- =============================================================

-- 初始化角色
INSERT INTO `sys_role` (`role_name`, `role_code`, `description`) VALUES
('超级管理员', 'ROLE_ADMIN', '系统超级管理员，拥有所有权限'),
('教师', 'ROLE_TEACHER', '教师角色，可管理题目和试卷'),
('学生', 'ROLE_STUDENT', '学生角色，可参加考试和练习')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- 初始化管理员用户（密码: admin123，需使用 BCrypt 加密）
-- 注意：生产环境请修改默认密码
INSERT INTO `sys_user` (`username`, `password`, `real_name`, `phone`, `email`, `user_type`, `status`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '系统管理员', '13800000000', 'admin@jieli.edu', 3, 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 初始化系统配置
INSERT INTO `sys_config` (`config_key`, `config_value`, `description`) VALUES
('system.name', '接力教育智慧云平台', '系统名称'),
('system.version', '1.0.0', '系统版本'),
('system.logo', '/assets/logo.png', '系统Logo'),
('upload.max_size', '104857600', '最大上传文件大小（字节）'),
('upload.allowed_types', 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip,rar', '允许上传的文件类型'),
('exam.default_duration', '120', '默认考试时长（分钟）'),
('exam.pass_rate', '60', '默认及格分数线（百分比）')
ON DUPLICATE KEY UPDATE `config_value` = VALUES(`config_value`);

-- =============================================================
-- 7. 添加外键约束（可选，根据性能需求决定是否启用）
-- =============================================================

-- ALTER TABLE `sys_user_role` 
--   ADD CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`),
--   ADD CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`);

-- ALTER TABLE `sys_role_permission`
--   ADD CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`),
--   ADD CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission` (`id`);

SET FOREIGN_KEY_CHECKS = 1;
