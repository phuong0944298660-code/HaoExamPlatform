#!/bin/bash
# 接力教育智慧云平台 - 一键重启 nginx 脚本
# 用途：修复 502 Bad Gateway 错误（nginx 无法连接 backend-java）
# 使用方法：在终端运行 bash restart-nginx.sh

echo "🔍 查找 nginx 容器..."
NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i nginx | head -1)

if [ -z "$NGINX_CONTAINER" ]; then
  echo "❌ 未找到运行中的 nginx 容器"
  echo "   请确认 docker-compose --profile java up -d 已启动"
  exit 1
fi

echo "✅ 找到容器: $NGINX_CONTAINER"
echo "🔄 重启 nginx 容器..."
docker restart "$NGINX_CONTAINER"

echo "⏳ 等待 3 秒..."
sleep 3

echo "🔍 验证 nginx 是否正常..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/health)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ nginx 修复成功！API 返回 200"
  echo "   请访问 http://localhost 使用平台"
else
  echo "⚠️  nginx 返回 HTTP $HTTP_CODE（期望 200）"
  echo "   如果还有问题，尝试重建后端容器："
  echo "   docker-compose --profile java up -d --build backend-java"
fi
