# 浏览器兼容性测试方案

## 测试目标
验证教育平台在不同浏览器和分辨率下的兼容性和稳定性。

## 测试环境要求

### 浏览器版本
| 浏览器 | 最低版本 | 推荐版本 | 测试优先级 |
|--------|----------|----------|------------|
| Chrome | 90+ | 最新版 | P0 |
| Firefox | 88+ | 最新版 | P0 |
| Safari | 14+ | 最新版 | P0 |
| Edge | 90+ | 最新版 | P0 |
| IE11 | 不支持 | - | 不支持 |

### 分辨率要求
| 场景 | 最低分辨率 | 推荐分辨率 | 布局适配 |
|------|-----------|-----------|----------|
| 学生考试 | 1280×720 | 1920×1080 | 自适应 |
| 教师管理 | 1024×768 | 1366×768 | 响应式 |
| 移动设备 | 768×1024 | - | 独立适配 |

## 测试用例

### 1. 页面渲染测试

#### 1.1 登录页面
- [ ] 表单元素正确显示
- [ ] 背景图片/颜色正常
- [ ] 输入框焦点样式正确
- [ ] 按钮hover效果正常
- [ ] 错误提示信息显示完整

#### 1.2 考试页面
- [ ] 题目内容正确渲染
- [ ] 选项布局整齐
- [ ] 计时器显示正常
- [ ] 答题卡导航可用
- [ ] 主观题输入框可正常使用

#### 1.3 批改页面
- [ ] 横向批改模式布局正确
- [ ] 题目与答案对照显示正常
- [ ] 评分输入框可用
- [ ] 批注功能正常

### 2. 功能兼容性测试

#### 2.1 JavaScript功能
| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| WebSocket连接 | ✅ | ✅ | ✅ | ✅ |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |
| 文件上传 | ✅ | ✅ | ✅ | ✅ |
| 打印功能 | ✅ | ✅ | ✅ | ✅ |
| 全屏模式 | ✅ | ✅ | ✅ | ✅ |

#### 2.2 CSS兼容性
- [ ] Flexbox布局
- [ ] CSS Grid布局
- [ ] CSS变量
- [ ] 过渡动画
- [ ] 媒体查询

### 3. 分辨率适配测试

#### 3.1 大屏测试 (1920×1080+)
- [ ] 内容居中显示
- [ ] 侧边栏正常展开
- [ ] 表格列宽合理

#### 3.2 标准屏测试 (1366×768)
- [ ] 所有元素可见
- [ ] 无需横向滚动
- [ ] 按钮可点击

#### 3.3 小屏测试 (1280×720)
- [ ] 侧边栏自动折叠
- [ ] 关键功能可用
- [ ] 文字大小合适

#### 3.4 平板测试 (768×1024)
- [ ] 触摸操作正常
- [ ] 菜单可展开/收起
- [ ] 弹窗居中显示

### 4. 性能测试

#### 4.1 页面加载时间
| 页面 | 目标时间 | 最大容忍时间 |
|------|----------|--------------|
| 登录页 | < 2s | < 5s |
| 仪表盘 | < 3s | < 6s |
| 考试页 | < 2s | < 4s |
| 批改页 | < 3s | < 6s |

#### 4.2 内存占用
- [ ] 单页面内存 < 200MB
- [ ] 长时间使用无内存泄漏
- [ ] 切换页面后内存释放正常

### 5. 自动化测试脚本

```javascript
// browser_test.js - 使用 Playwright 进行跨浏览器测试
const { test, expect } = require('@playwright/test');

const browsers = ['chromium', 'firefox', 'webkit'];

browsers.forEach(browserType => {
  test.describe(`${browserType} 兼容性测试`, () => {
    test('登录页面渲染测试', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // 截图对比
      await expect(page).toHaveScreenshot(`login-${browserType}.png`);
      
      // 表单元素检查
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
    
    test('考试页面响应式测试', async ({ page }) => {
      // 测试不同分辨率
      const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1280, height: 720 },
        { width: 768, height: 1024 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:3000/exam/1');
        
        // 检查关键元素可见性
        await expect(page.locator('.exam-timer')).toBeVisible();
        await expect(page.locator('.question-content')).toBeVisible();
      }
    });
  });
});
```

## 测试执行步骤

### 1. 环境准备
```bash
# 安装依赖
npm install -g playwright
npm install @playwright/test

# 安装浏览器
npx playwright install
```

### 2. 执行测试
```bash
# 运行所有浏览器测试
npx playwright test

# 生成测试报告
npx playwright show-report
```

### 3. 手动测试检查清单
- [ ] 清除浏览器缓存后测试
- [ ] 隐私/无痕模式下测试
- [ ] 禁用JavaScript后测试（降级 gracefully）
- [ ] 网络限速（3G）下测试

## 问题记录模板

```markdown
### 问题 #[编号]
- **浏览器**: [Chrome/Firefox/Safari/Edge]
- **版本**: [版本号]
- **分辨率**: [分辨率]
- **问题描述**: 
- **重现步骤**:
  1. 
  2. 
  3. 
- **期望结果**:
- **实际结果**:
- **截图**: [链接]
- **严重程度**: [P0/P1/P2]
```

## 通过标准

- P0级浏览器所有功能正常
- P0级分辨率布局无错乱
- 页面加载时间符合要求
- 无JavaScript错误
- 关键功能可用性100%
