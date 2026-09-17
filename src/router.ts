import { createRouter, createWebHashHistory } from 'vue-router'
import { can, isLoggedIn } from '@/store'
import AppShell from '@/components/AppShell.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CompaniesView from '@/views/CompaniesView.vue'
import AgentsView from '@/views/AgentsView.vue'
import OwnersView from '@/views/OwnersView.vue'
import SubmissionsView from '@/views/SubmissionsView.vue'
import ShopsView from '@/views/ShopsView.vue'
import TrafficCardsView from '@/views/TrafficCardsView.vue'
import ProtectionPeriodsView from '@/views/ProtectionPeriodsView.vue'
import ShopTypesView from '@/views/ShopTypesView.vue'
import TasksView from '@/views/TasksView.vue'
import RulesView from '@/views/RulesView.vue'
import ExpensesView from '@/views/ExpensesView.vue'
import SettlementView from '@/views/SettlementView.vue'
import CompanySettlementView from '@/views/CompanySettlementView.vue'
import ReconciliationView from '@/views/ReconciliationView.vue'
import ReportsView from '@/views/ReportsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AuditView from '@/views/AuditView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { title: '登录' } },
    {
      path: '/',
      component: AppShell,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView, meta: { title: '经营工作台', subtitle: '掌握店铺健康、结算进度与待办事项', icon: 'dashboard' } },
        { path: 'companies', name: 'companies', component: CompaniesView, meta: { title: '公司管理', subtitle: '维护合作公司、编码规则与业务区域', icon: 'building', permission: 'manageCompanies' } },
        { path: 'agents', name: 'agents', component: AgentsView, meta: { title: '代理体系', subtitle: '管理代理关系、团队收益与数据范围', icon: 'network', permission: 'manageAgents' } },
        { path: 'owners', name: 'owners', component: OwnersView, meta: { title: '人头档案', subtitle: '录入实名、银行、证件图片并追踪开店状态', icon: 'users' } },
        { path: 'submissions', name: 'submissions', component: SubmissionsView, meta: { title: '人头提交', subtitle: '顶级代理提交公司，公司审核后安排开店', icon: 'send' } },
        { path: 'shop-types', name: 'shop-types', component: ShopTypesView, meta: { title: '店铺类型', subtitle: '管理公司运营平台，新增店铺时选择使用', icon: 'grid', permission: 'manageShopTypes' } },
        { path: 'shops', name: 'shops', component: ShopsView, meta: { title: '店铺档案', subtitle: '追踪店铺存活、归属和结算模式', icon: 'store' } },
        { path: 'protection-periods', name: 'protection-periods', component: ProtectionPeriodsView, meta: { title: '保护期', subtitle: '维护公司保护期类型，并在店铺开店时选择使用', icon: 'shield', permission: 'manageProtectionPeriods' } },
        { path: 'traffic-cards', name: 'traffic-cards', component: TrafficCardsView, meta: { title: '流量卡管理', subtitle: '一店一卡，维护流量卡号、每月续费日与到期状态', icon: 'card', permission: 'manageTrafficCards' } },
        { path: 'tasks', name: 'tasks', component: TasksView, meta: { title: '开店任务', subtitle: '发布、承接与追踪开店任务进度', icon: 'briefcase', permission: 'viewTasks' } },
        { path: 'rules', name: 'rules', component: RulesView, meta: { title: '租金与分配规则', subtitle: '规则版本化，保留每个结算月份的历史快照', icon: 'sliders', permission: 'manageAgents' } },
        { path: 'expenses', name: 'expenses', component: ExpensesView, meta: { title: '垫付杂费', subtitle: '录入凭证、按月汇总并由公司全额报销', icon: 'receipt', permission: 'viewExpenses' } },
        { path: 'company-settlement', name: 'company-settlement', component: CompanySettlementView, meta: { title: '结算模式', subtitle: '设置公司一次性或按月给与顶级代理的金额', icon: 'sliders', permission: 'manageCompanySettlement' } },
        { path: 'settlement', name: 'settlement', component: SettlementView, meta: { title: '月度核算', subtitle: '店租与杂费合并核算，确认后登记支付', icon: 'wallet', permission: 'settle' } },
        { path: 'reconciliation', name: 'reconciliation', component: ReconciliationView, meta: { title: '支付与对账', subtitle: '应结、实结和差异追踪', icon: 'scale', permission: 'viewReconciliation' } },
        { path: 'reports', name: 'reports', component: ReportsView, meta: { title: '报表与导出', subtitle: '多维查询并导出 Excel 兼容 CSV / TXT', icon: 'chart', permission: 'viewReports' } },
        { path: 'audit', name: 'audit', component: AuditView, meta: { title: '操作日志', subtitle: '关键业务操作完整留痕', icon: 'history', permission: 'viewAudit' } },
        { path: 'settings', name: 'settings', component: SettingsView, meta: { title: '系统设置', subtitle: '界面语言、视觉主题与演示数据', icon: 'settings' } },
      ],
    },
  ],
})

router.beforeEach(to => {
  if (to.meta.requiresAuth && !isLoggedIn.value) return { name: 'login' }
  if (to.name === 'login' && isLoggedIn.value) return { name: 'dashboard' }
  if (to.meta.permission && !can(String(to.meta.permission))) return { name: 'dashboard' }
})

export default router
