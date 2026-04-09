import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { generateRoutesFromMenus, type MenuItem } from './dynamicRoutes'
import { message } from 'ant-design-vue'

NProgress.configure({ showSpinner: false })

// ==================== 静态路由（不需要权限控制的路由）====================
const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/activate',
    name: 'Activate',
    component: () => import('@/views/Activate.vue'),
    meta: { title: '激活账号', public: true },
  },
  // 管理端默认根路由（动态路由加载前使用）
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { title: '管理控制台', role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '管理控制台' },
      },
    ],
  },
  // 学生端路由（结构稳定，保持静态）
  {
    path: '/student',
    component: () => import('@/layouts/StudentLayout.vue'),
    meta: { role: 'student' },
    children: [
      { path: '', name: 'StudentHome', component: () => import('@/views/student/Home.vue'), meta: { title: '学生首页' } },
      { path: 'exam/:examId', name: 'StudentExam', component: () => import('@/views/student/ExamPage.vue'), meta: { title: '答题', accountType: 'EXAM' } },
      { path: 'result/:examId', name: 'StudentResult', component: () => import('@/views/student/ExamResult.vue'), meta: { title: '考试结果', accountType: 'EXAM' } },
      { path: 'practice', name: 'PracticeHome', component: () => import('@/views/student/PracticeHome.vue'), meta: { title: '题库练习', accountType: 'PRACTICE' } },
      { path: 'practice/banks/:bankId', name: 'PracticePage', component: () => import('@/views/student/PracticePage.vue'), meta: { title: '练习中', accountType: 'PRACTICE' } },
      { path: 'practice/wrong-answers', name: 'WrongAnswerBook', component: () => import('@/views/student/WrongAnswerBook.vue'), meta: { title: '错题本', accountType: 'PRACTICE' } },
    ],
  },
  // 教师端路由（结构稳定，保持静态）
  {
    path: '/teacher',
    component: () => import('@/layouts/TeacherLayout.vue'),
    meta: { role: 'teacher' },
    children: [
      { path: '', name: 'TeacherDashboard', component: () => import('@/views/teacher/Dashboard.vue'), meta: { title: '教师工作台' } },
      { path: 'question-banks', name: 'QuestionBanks', component: () => import('@/views/teacher/QuestionBanks.vue'), meta: { title: '题库管理' } },
      { path: 'question-banks/:bankId', name: 'QuestionBankDetail', component: () => import('@/views/teacher/QuestionBankDetail.vue'), meta: { title: '题库详情' } },
      { path: 'papers', name: 'Papers', component: () => import('@/views/teacher/Papers.vue'), meta: { title: '套卷管理' } },
      { path: 'papers/:paperId', name: 'PaperDetail', component: () => import('@/views/teacher/PaperDetail.vue'), meta: { title: '套卷编辑' } },
      { path: 'exams', name: 'Exams', component: () => import('@/views/teacher/Exams.vue'), meta: { title: '考试管理' } },
      { path: 'exams/:examId', name: 'ExamView', component: () => import('@/views/teacher/ExamView.vue'), meta: { title: '考试详情' } },
      { path: 'exams/:examId/edit', name: 'ExamEdit', component: () => import('@/views/teacher/ExamDetail.vue'), meta: { title: '编辑考试' } },
      { path: 'exams/:examId/dashboard', name: 'ExamDashboard', component: () => import('@/views/teacher/ExamDashboard.vue'), meta: { title: '考试看板' } },
      { path: 'scores', name: 'Scores', component: () => import('@/views/teacher/Scores.vue'), meta: { title: '成绩管理' } },
      { path: 'classes', name: 'Classes', component: () => import('@/views/teacher/Classes.vue'), meta: { title: '班级管理' } },
      { path: 'classes/:classId', name: 'ClassDetail', component: () => import('@/views/teacher/ClassStudents.vue'), meta: { title: '班级学生' } },
      { path: 'classes/:classId/scores', name: 'ClassScores', component: () => import('@/views/teacher/ClassScores.vue'), meta: { title: '班级成绩' } },
      { path: 'students/:studentId', name: 'StudentDetail', component: () => import('@/views/teacher/StudentDetail.vue'), meta: { title: '学生详情' } },
      { path: 'resources', name: 'Resources', component: () => import('@/views/teacher/Resources.vue'), meta: { title: '资源中心' } },
      { path: 'grading', name: 'Grading', component: () => import('@/views/teacher/GradingPage.vue'), meta: { title: '主观题批阅' } },
    ],
  },
  // 403 无权限页面
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限访问', public: true },
  },
  // 404 页面 - 不设置为 public，以便触发动态路由加载
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/LoadError.vue'),
    meta: { title: '页面不存在' },
  },
]

// ==================== 创建 Router 实例 ====================
const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// ==================== 动态路由管理 ====================

// 标记是否已经加载动态路由
let hasLoadedDynamicRoutes = false

/**
 * 加载动态路由
 * 从后端获取菜单配置并生成路由
 */
export async function loadDynamicRoutes(): Promise<boolean> {
  if (hasLoadedDynamicRoutes) return true

  try {
    const token = localStorage.getItem('token')
    if (!token) return false

    // 从后端获取菜单
    const res = await fetch('/api/v1/system/menus/nav', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()

    if (data.code === 200 && data.data) {
      // 生成动态路由
      const dynamicRoutes = generateRoutesFromMenus(data.data)

      // 添加路由
      let addedCount = 0
      for (const route of dynamicRoutes) {
        // 检查路由是否已存在
        try {
          const existingRoute = router.resolve(route.path)
          if (existingRoute.name === undefined || existingRoute.name === 'NotFound') {
            router.addRoute(route)
            addedCount++
          }
        } catch {
          // 路由不存在，添加
          router.addRoute(route)
          addedCount++
        }
      }

      hasLoadedDynamicRoutes = true
      console.log(`[Router] 动态路由加载完成，新增 ${addedCount} 条路由`)
      return true
    }
  } catch (err) {
    console.error('[Router] 加载动态路由失败:', err)
  }
  return false
}

/**
 * 重置动态路由
 * 用于退出登录后清除动态路由
 */
export function resetDynamicRoutes(): void {
  if (!hasLoadedDynamicRoutes) return

  // 获取所有路由
  const routes = router.getRoutes()

  // 移除所有动态添加的路由
  for (const route of routes) {
    if (route.name && !['Login', 'Activate', 'StudentHome', 'TeacherDashboard', 'Forbidden', 'NotFound'].includes(route.name as string)) {
      router.removeRoute(route.name)
    }
  }

  hasLoadedDynamicRoutes = false
  console.log('[Router] 动态路由已重置')
}

// ==================== 路由守卫 ====================

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || '接力教育'} - 智慧云平台`

  // 安全获取 localStorage 数据
  let token: string | null = null
  let user: any = null

  try {
    token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (userStr && userStr !== 'null') {
      user = JSON.parse(userStr)
    }
  } catch (e) {
    console.error('[Router] 解析用户数据失败:', e)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 公开页面直接放行
  if (to.meta.public) {
    if (token && user?.role && to.path === '/login') {
      const roleLower = user.role?.toLowerCase()
      const redirectPath = roleLower === 'admin' ? '/' :
                          roleLower === 'teacher' ? '/teacher' : '/student'
      next(redirectPath)
      return
    }
    next()
    return
  }

  // 未登录跳转登录页
  if (!token) {
    next('/login')
    return
  }

  // 加载动态路由（仅管理员需要）
  const userRoleLower = user?.role?.toLowerCase()
  if (userRoleLower === 'admin' && !hasLoadedDynamicRoutes) {
    const success = await loadDynamicRoutes()

    if (success) {
      // 重新导航到目标路由（确保新添加的路由生效）
      next({ path: to.path, query: to.query, replace: true })
      return
    }
  }

  // 角色权限检查
  if (to.meta.role && user) {
    // admin 可以访问所有页面
    if (userRoleLower === 'admin') {
      next()
      return
    }
    // 角色不匹配，跳转到对应首页
    if (userRoleLower !== to.meta.role) {
      const redirectPath = userRoleLower === 'admin' ? '/' :
                          userRoleLower === 'teacher' ? '/teacher' : '/student'

      console.log('[Router] 角色不匹配，当前角色:', userRoleLower, '，页面需要:', to.meta.role, '，重定向到:', redirectPath)

      if (to.path === redirectPath) {
        next()
      } else {
        next(redirectPath)
      }
      return
    }
  }

  // 检查页面权限
  if (to.meta.perms && user) {
    const userPerms = user.permissions || []
    const hasPerm = userPerms.includes(to.meta.perms as string)

    if (!hasPerm) {
      console.log('[Router] 无权限访问:', to.meta.perms)
      message.error('无权限访问该页面')
      next('/403')
      return
    }
  }

  // 账号类型检查（PRACTICE / EXAM 账号隔离）
  if (to.meta.accountType && user) {
    const userAccountType = (user.accountType || user.account_type || '').toUpperCase()
    const requiredType = (to.meta.accountType as string).toUpperCase()
    if (userAccountType && userAccountType !== requiredType) {
      const redirectPath = userRoleLower === 'student' ? '/student' : `/${userRoleLower}`
      console.log(`[Router] 账号类型不匹配 (需要 ${requiredType}，实际 ${userAccountType})，重定向到: ${redirectPath}`)
      next(redirectPath)
      return
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
