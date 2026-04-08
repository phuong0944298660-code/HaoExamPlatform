#!/bin/bash
# 接力教育智慧云平台 - E2E测试环境准备脚本

set -e

echo "🚀 开始准备E2E测试环境..."

# 1. 进入e2e目录
cd "$(dirname "$0")/../e2e"

# 2. 安装依赖
echo "📦 安装npm依赖..."
npm install

# 3. 安装Playwright浏览器
echo "🌐 安装Playwright浏览器..."
npx playwright install chromium firefox webkit

# 4. 返回项目根目录
cd ..

# 5. 检查后端服务
echo "🔍 检查后端服务状态..."
if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常运行"
else
    echo "⚠️  后端服务未启动，请先启动后端服务:"
    echo "   cd app && python -m uvicorn main:app --reload"
fi

# 6. 检查前端服务
echo "🔍 检查前端服务状态..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ 前端服务正常运行"
else
    echo "⚠️  前端服务未启动，请先启动前端服务:"
    echo "   cd frontend && npm run dev"
fi

# 7. 初始化测试数据
echo "📝 初始化测试数据..."
if command -v mysql &> /dev/null; then
    mysql -u root -p jieli_edu < scripts/init-test-data.sql
    echo "✅ 测试数据已初始化"
else
    echo "⚠️  未找到mysql命令，请手动执行SQL脚本:"
    echo "   mysql -u your_username -p jieli_edu < scripts/init-test-data.sql"
fi

# 8. 生成基准截图
echo "📸 生成视觉回归基准截图..."
cd e2e
npx playwright test --update-snapshots || true

echo ""
echo "✅ E2E测试环境准备完成!"
echo ""
echo "📋 后续步骤:"
echo "   1. 确保后端服务运行: cd app && python -m uvicorn main:app --reload"
echo "   2. 确保前端服务运行: cd frontend && npm run dev"
echo "   3. 运行测试: cd e2e && npx playwright test"
