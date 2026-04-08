-- ============================================================
-- V3: 修改 accounts 表唯一索引，支持软删除后重建账号
-- ============================================================
-- 原问题：username 和 identity_no 有唯一约束，软删除后无法创建同名账号
-- 解决方案：改为 (username, is_deleted) 和 (identity_no, is_deleted) 组合唯一索引
-- 这样已删除和未删除的账号可以有相同用户名，但不能有两个未删除的同名账号

-- 1. 删除旧的唯一索引
DROP INDEX IF EXISTS UKk8h1bgqoplx0rkngj01pm1rgp ON accounts;
DROP INDEX IF EXISTS UK1qt3dpex4gtf1aamkquye04f2 ON accounts;

-- 2. 创建新的组合唯一索引
-- 注意：MySQL 中 NULL 值在唯一索引中的处理，这里使用 (username, is_deleted) 组合
-- 对于已删除的记录 is_deleted=1，可以重复；未删除的 is_deleted=0，必须唯一
ALTER TABLE accounts ADD UNIQUE INDEX uk_username_is_deleted (username, is_deleted);
ALTER TABLE accounts ADD UNIQUE INDEX uk_identity_no_is_deleted (identity_no, is_deleted);
