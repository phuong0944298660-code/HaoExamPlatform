#!/bin/bash
# 停止本地开发环境

echo "🛑 停止接力教育智慧云平台..."

# 停止简化版
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# 停止完整版
docker-compose down 2>/dev/null || true

echo "✅ 已停止"
