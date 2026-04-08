#!/bin/bash
# 修复数据库 GradeGroup.MIDDLE 枚举问题
echo "正在修复数据库中的 MIDDLE 枚举值..."
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db" | head -1)
echo "数据库容器: $DB_CONTAINER"
docker exec "$DB_CONTAINER" mysql -uroot -prootpass jieli_edu -e "
  UPDATE accounts SET grade_group='JUNIOR' WHERE grade_group='MIDDLE';
  UPDATE activation_plans SET target_grade_group='JUNIOR' WHERE target_grade_group='MIDDLE';
  SELECT '修复完成' as 结果, COUNT(*) as 初中组账号数 FROM accounts WHERE grade_group='JUNIOR';
"
echo "数据库修复完成！"
