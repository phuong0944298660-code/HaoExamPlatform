-- Add resource_ids column to activation_plans to support resource allocation via activation codes
ALTER TABLE activation_plans ADD COLUMN resource_ids JSON DEFAULT NULL COMMENT '关联的资源ID数组，JSON格式: [1,2,3]';
