import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
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
  // ── 学生端 ──
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
  // ── 教师端 ──
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
  // ── 管理端 ──
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { role: 'admin' },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '管理控制台' } },
      // 账号管理
      {
        path: 'accounts',
        meta: { title: '账号管理' },
        children: [
          { path: 'list', name: 'Accounts', component: () => import('@/views/admin/AccountManager.vue'), meta: { title: '账号列表' } },
          { path: 'practice', name: 'PracticeAccounts', component: () => import('@/views/admin/AccountManager.vue'), meta: { title: '生成练习账号', activeMenu: '/accounts/list' } },
          { path: 'exam', name: 'ExamAccounts', component: () => import('@/views/admin/AccountManager.vue'), meta: { title: '生成考试账号', activeMenu: '/accounts/list' } },
          { path: 'activation', name: 'ActivationCodes', component: () => import('@/views/admin/ActivationCodes.vue'), meta: { title: '激活码管理' } },
          { path: 'activation-codes/generate', name: 'ActivationCodesGenerate', component: () => import('@/views/admin/ActivationCodes.vue'), meta: { title: '生成激活码', activeMenu: '/accounts/activation' } },
          { path: 'plans', name: 'ActivationPlans', component: () => import('@/views/admin/ActivationPlans.vue'), meta: { title: '激活计划管理' }, alias: ['activation-plans'] },
        ]
      },
      // 业务管理
      { path: 'questions/banks', name: 'AdminQuestionBanks', component: () => import('@/views/admin/QuestionBankList.vue'), meta: { title: '题库管理' }, alias: ['/questions/question-banks', '/questions/list', '/admin/question-banks'] },
      { path: 'questions/banks/:bankId', name: 'AdminQuestionBankDetail', component: () => import('@/views/admin/QuestionBankDetail.vue'), meta: { title: '题库详情' } },
      { path: 'questions/import', name: 'AdminQuestionsImport', component: () => import('@/views/admin/QuestionBankList.vue'), meta: { title: '批量导入题目', activeMenu: '/questions/banks' } },
      { path: 'papers/list', name: 'AdminPapers', component: () => import('@/views/admin/PaperManager.vue'), meta: { title: '试卷列表' }, alias: ['/papers/all', '/admin/papers'] },
      { path: 'papers/:paperId', name: 'AdminPaperDetail', component: () => import('@/views/teacher/PaperDetail.vue'), meta: { title: '试卷编辑' } },
      { path: 'exams/list', name: 'AdminExams', component: () => import('@/views/admin/ExamManager.vue'), meta: { title: '考试管理' }, alias: ['/exams/all', '/admin/exams'] },
      { path: 'exams/create', name: 'AdminExamCreate', component: () => import('@/views/admin/ExamManager.vue'), meta: { title: '创建考试', activeMenu: '/exams/list' } },
      { path: 'exams/monitoring', name: 'AdminExamMonitoring', component: () => import('@/views/teacher/ExamDashboard.vue'), meta: { title: '实时监控' } },
      { path: 'scores/list', name: 'AdminScores', component: () => import('@/views/admin/ScoreManager.vue'), meta: { title: '成绩管理' }, alias: ['/scores/stats', '/scores/scores', '/admin/results'] },
      { path: 'resources/list', name: 'AdminResources', component: () => import('@/views/admin/ResourceManager.vue'), meta: { title: '资源管理' }, alias: ['/resources/library', '/resources/resources'] },
      { path: 'feedbacks/list', name: 'AdminFeedbacks', component: () => import('@/views/admin/FeedbackManager.vue'), meta: { title: '赛事反馈' }, alias: ['/feedback/process'] },
      // 系统管理
      { path: 'system/users', name: 'SystemUsers', component: () => import('@/views/system/users/index.vue'), meta: { title: '用户管理' } },
      { path: 'system/roles', name: 'SystemRoles', component: () => import('@/views/system/roles/index.vue'), meta: { title: '角色管理' } },
      { path: 'system/menus', name: 'SystemMenus', component: () => import('@/views/system/menus/index.vue'), meta: { title: '菜单管理' } },
      // 部门管理 (暂无后端支持，设为二级路由或暂缓)
      { path: 'system/depts', name: 'SystemDepts', component: () => import('@/views/system/users/index.vue'), meta: { title: '部门管理' } },
      { path: 'system/dict', name: 'SystemDict', component: () => import('@/views/system/dict/index.vue'), meta: { title: '字典管理' } },
      { path: 'system/config', name: 'SystemConfig', component: () => import('@/views/system/config/index.vue'), meta: { title: '参数管理' } },
      { path: 'system/notice', name: 'SystemNotice', component: () => import('@/views/system/notice/index.vue'), meta: { title: '通知公告' } },
      { path: 'system/operation-logs', name: 'SystemOperationLogs', component: () => import('@/views/system/logs/operation.vue'), meta: { title: '操作日志' } },
      { path: 'system/login-logs', name: 'SystemLoginLogs', component: () => import('@/views/system/logs/login.vue'), meta: { title: '登录日志' } },
    ],
  },
  // 默认重定向或 404
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
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
    // 已登录用户访问登录页，跳转到对应首页
    if (token && user?.role && to.path === '/login') {
      const roleLower = user.role?.toLowerCase()
      const redirectPath = roleLower === 'admin' ? '/' :
                          roleLower === 'teacher' ? '/teacher' : '/student'
      console.log('[Router] 已登录用户访问登录页，重定向到:', redirectPath)
      next(redirectPath)
      return
    }
    next()
    return
  }

  // 未登录跳转登录页
  if (!token) {
    console.log('[Router] 未登录，跳转登录页')
    next('/login')
    return
  }

  // 角色权限检查
  if (to.meta.role && user) {
    // admin 可以访问所有页面
    const userRoleLower = user.role?.toLowerCase()
    if (userRoleLower === 'admin') {
      next()
      return
    }
    // 角色不匹配，跳转到对应首页
    if (userRoleLower !== to.meta.role) {
      const redirectPath = userRoleLower === 'admin' ? '/' : 
                          userRoleLower === 'teacher' ? '/teacher' : '/student'
      
      console.log('[Router] 角色不匹配，当前角色:', userRoleLower, '，页面需要:', to.meta.role, '，重定向到:', redirectPath)
      
      // 防止无限重定向
      if (to.path === redirectPath) {
        next()
      } else {
        next(redirectPath)
      }
      return
    }
  }

  // 账号类型检查（PRACTICE / EXAM 账号隔离）
  if (to.meta.accountType && user) {
    const userAccountType = (user.accountType || user.account_type || '').toUpperCase()
    const requiredType = (to.meta.accountType as string).toUpperCase()
    if (userAccountType && userAccountType !== requiredType) {
      // 重定向到对应的首页
      const redirectPath = user.role?.toLowerCase() === 'student' ? '/student' : `/${user.role?.toLowerCase()}`
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
