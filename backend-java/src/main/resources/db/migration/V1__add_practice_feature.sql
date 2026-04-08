-- ============================================================
-- V1: 添加练习功能相关表及字段
-- ============================================================

-- 练习记录表
CREATE TABLE IF NOT EXISTS practice_records (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id    INT         NOT NULL COMMENT '学生账号ID',
  question_id   INT         NOT NULL COMMENT '题目ID',
  question_bank_id INT      NOT NULL COMMENT '所属题库ID',
  student_answer TEXT       COMMENT '学生答案',
  is_correct    TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '是否正确',
  practice_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '练习时间',
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT(1)  NOT NULL DEFAULT 0,
  version       INT         NOT NULL DEFAULT 1,
  INDEX idx_pr_account_id (account_id),
  INDEX idx_pr_question_id (question_id),
  INDEX idx_pr_question_bank_id (question_bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='练习记录表';

-- 错题本表
CREATE TABLE IF NOT EXISTS wrong_answer_books (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id      INT         NOT NULL COMMENT '学生账号ID',
  question_id     INT         NOT NULL COMMENT '题目ID',
  question_bank_id INT        NOT NULL COMMENT '所属题库ID',
  wrong_count     INT         NOT NULL DEFAULT 1 COMMENT '答错次数',
  is_resolved     TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '是否已掌握',
  last_wrong_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近答错时间',
  resolved_at     DATETIME    NULL COMMENT '标记掌握时间',
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted      TINYINT(1)  NOT NULL DEFAULT 0,
  version         INT         NOT NULL DEFAULT 1,
  UNIQUE KEY uk_wab_account_question (account_id, question_id),
  INDEX idx_wab_account_id (account_id),
  INDEX idx_wab_question_bank_id (question_bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题本表';

-- 更新 questions 表：添加解析图片字段
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS analysis_images JSON NULL COMMENT '解析图片URL数组 ["url1","url2"]';

-- 更新 activation_plans 表：添加关联题库ID字段
ALTER TABLE activation_plans
  ADD COLUMN IF NOT EXISTS question_bank_ids JSON NULL COMMENT '关联题库ID数组 [1,2,3]';
