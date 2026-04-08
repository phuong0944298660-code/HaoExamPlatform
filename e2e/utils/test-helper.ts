/**
 * 测试辅助工具类
 * 根据实际页面结构调整
 */

import { Page, expect } from '@playwright/test';

export class TestHelper {
  private page: Page | null = null;

  async init(page: Page) {
    this.page = page;
  }

  /**
   * 管理员登录
   */
  async adminLogin() {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await this.page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await this.page.fill('input[placeholder="请输入密码"]', 'admin123');
    await this.page.click('button:has-text("登 录")');
    
    await this.page.waitForTimeout(3000);
  }

  /**
   * 教师登录
   */
  async teacherLogin(grade: 'primary' | 'junior' = 'primary') {
    if (!this.page) throw new Error('Page not initialized');
    
    const username = grade === 'primary' ? 'teacher1' : 'teacher_junior';
    
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await this.page.fill('input[placeholder="身份证号 / 用户名"]', username);
    await this.page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await this.page.click('button:has-text("登 录")');
    
    await this.page.waitForTimeout(3000);
  }

  /**
   * 学生/用户登录
   */
  async login(identityNo: string, password: string) {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await this.page.fill('input[placeholder="身份证号 / 用户名"]', identityNo);
    await this.page.fill('input[placeholder="请输入密码"]', password);
    await this.page.click('button:has-text("登 录")');
    
    await this.page.waitForTimeout(3000);
  }

  /**
   * 获取有效的激活码
   */
  async getValidActivationCode(role: string, gradeGroup: string): Promise<string> {
    const codes: Record<string, string> = {
      'student-primary': 'STUDENT-PRIMARY-001',
      'student-junior': 'STUDENT-JUNIOR-001',
      'teacher-primary': 'TEACHER-PRIMARY-001',
      'teacher-junior': 'TEACHER-JUNIOR-001',
    };
    return codes[`${role}-${gradeGroup}`] || 'TEST-CODE-001';
  }

  /**
   * 获取已使用的激活码
   */
  async getUsedActivationCode(): Promise<string> {
    return 'USED-CODE-001';
  }

  /**
   * 获取已使用激活码的ID
   */
  async getUsedActivationCodeId(): Promise<number> {
    return 1;
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions() {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      const response = await this.page.evaluate(async () => {
        const res = await fetch('/api/v1/activations/my-permissions');
        return res.json();
      });
      
      return response.data || {
        question_banks: [],
        resource_packages: [],
        features: {},
        is_activated: false,
        expire_at: null,
      };
    } catch (e) {
      return {
        question_banks: [],
        resource_packages: [],
        features: {},
        is_activated: false,
        expire_at: null,
      };
    }
  }

  /**
   * 截图保存
   */
  async screenshot(name: string) {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.screenshot({ 
      path: `./test-results/screenshots/${name}_${Date.now()}.png`,
      fullPage: true 
    });
  }
}
