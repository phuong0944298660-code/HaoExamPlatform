import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright配置 - 接力教育智慧云平台E2E测试
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  
  /* 测试文件匹配模式 */
  testMatch: ['**/*.spec.ts', '**/*-agent.ts'],
  
  /* 全局超时设置 */
  timeout: 60 * 1000, // 60秒
  
  /* 期待超时 */
  expect: {
    timeout: 10 * 1000, // 10秒
  },
  
  /* 并发设置 */
  fullyParallel: false,
  workers: 1, // 单worker避免测试间干扰
  
  /* 失败重试 */
  retries: 1,
  
  /* 报告器配置 */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/test-results.json' }]
  ],
  
  /* 共享项目配置 */
  use: {
    /* 基础URL - 使用本地前端开发服务器 (Vite) */
    baseURL: 'http://localhost:5176',
    
    /* 视口大小 */
    viewport: { width: 1440, height: 900 },
    
    /* 截图策略 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
    
    /* 追踪 */
    trace: 'on-first-retry',
    
    /* 操作超时 */
    actionTimeout: 10 * 1000,
    
    /* 导航超时 */
    navigationTimeout: 30 * 1000,
  },
  
  /* 项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
        }
      },
    },
  ],
  
  /* Web服务器配置（如需要） */
  webServer: process.env.CI ? {
    command: 'cd ../frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  } : undefined,
});
