<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from './Icon.vue'
import { can, currentUser, logout, setTheme, state, unresolvedExpenses } from '@/store'
import { users } from '@/data/seed'
import type { ThemeId } from '@/types'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)
const userOpen = ref(false)
const nav = [
  { group: '业务总览', items: [{ name: 'dashboard', label: '经营工作台', icon: 'dashboard' }] },
  { group: '组织与档案', items: [
    { name: 'companies', label: '公司管理', icon: 'building', permission: 'manageCompanies' },
    { name: 'agents', label: '代理体系', icon: 'network', permission: 'manageAgents' },
    { name: 'owners', label: '人头档案', icon: 'users' },
    { name: 'submissions', label: '人头提交', icon: 'send' },
    { name: 'shop-types', label: '店铺类型', icon: 'grid', permission: 'manageShopTypes' },
    { name: 'shops', label: '店铺档案', icon: 'store' },
    { name: 'protection-periods', label: '保护期', icon: 'shield', permission: 'manageProtectionPeriods' },
    { name: 'traffic-cards', label: '流量卡管理', icon: 'card', permission: 'manageTrafficCards' },
  ] },
  { group: '业务运营', items: [
    { name: 'tasks', label: '开店任务', icon: 'briefcase', permission: 'viewTasks' },
    { name: 'rules', label: '租金与分配规则', icon: 'sliders', permission: 'manageAgents' },
    { name: 'expenses', label: '垫付杂费', icon: 'receipt', permission: 'viewExpenses' },
  ] },
  { group: '财务结算', items: [
    { name: 'company-settlement', label: '结算模式', icon: 'sliders', permission: 'manageCompanySettlement' },
    { name: 'settlement', label: '月度核算', icon: 'wallet', permission: 'settle', badge: true },
    { name: 'reconciliation', label: '支付与对账', icon: 'scale', permission: 'viewReconciliation' },
    { name: 'reports', label: '报表与导出', icon: 'chart', permission: 'viewReports' },
  ] },
  { group: '系统', items: [
    { name: 'audit', label: '操作日志', icon: 'history', permission: 'viewAudit' },
    { name: 'settings', label: '系统设置', icon: 'settings' },
  ] },
]
const filteredNav = computed(() => nav.map(group => ({ ...group, items: group.items.filter(item => !item.permission || can(item.permission)) })).filter(group => group.items.length))
const pageTitle = computed(() => String(route.meta.title || 'FenFlow'))
const pageSubtitle = computed(() => String(route.meta.subtitle || ''))
const today = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())
const search = ref('')
const themes: { id: ThemeId; name: string; colors: string[] }[] = [
  { id: 1, name: '指挥舱', colors: ['#07141c', '#62e0be'] },
  { id: 2, name: '海岛工作台', colors: ['#087d73', '#f4f8f7'] },
  { id: 3, name: '瑞士财务网格', colors: ['#111111', '#d8ff36'] },
  { id: 4, name: '代理关系图谱', colors: ['#5d3c91', '#d7b967'] },
]
function chooseTheme(id: ThemeId) { setTheme(id); userOpen.value = false }
function go(name: string) { router.push({ name }); mobileOpen.value = false }
function doLogout() { logout(); router.push({ name: 'login' }) }
function switchUser(id: string) {
  const selected = users.find(u => u.id === id)
  if (!selected) return
  state.currentUserId = id
  state.language = selected.language
  userOpen.value = false
  router.push({ name: 'dashboard' })
}
function submitSearch() {
  if (!search.value.trim()) return
  router.push({ name: 'shops', query: { q: search.value.trim() } })
  search.value = ''
}
</script>
<template>
  <div class="app-shell" :class="'theme-' + state.theme">
    <div v-if="mobileOpen" class="mobile-scrim" @click="mobileOpen=false" />
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="brand-row">
        <div class="brand-mark"><span>F</span></div>
        <div><strong>FenFlow</strong><small>跨境开店结算平台</small></div>
        <button class="icon-btn mobile-only" @click="mobileOpen=false"><Icon name="x" /></button>
      </div>
      <div class="workspace-pill">
        <div class="workspace-icon"><Icon name="sparkles" :size="15" /></div>
        <div><small>当前业务空间</small><strong>{{ currentUser?.roleLabel }}</strong></div>
        <Icon name="chevronDown" :size="15" />
      </div>
      <nav class="sidebar-nav">
        <section v-for="group in filteredNav" :key="group.group">
          <p>{{ group.group }}</p>
          <button v-for="item in group.items" :key="item.name" class="nav-link" :class="{ active: route.name === item.name }" @click="go(item.name)">
            <Icon :name="item.icon" :size="17" />
            <span>{{ item.label }}</span>
            <b v-if="item.name==='settlement' && unresolvedExpenses.length">{{ unresolvedExpenses.length }}</b>
          </button>
        </section>
      </nav>
      <div class="sidebar-foot">
        <div class="theme-strip">
          <span v-for="theme in themes" :key="theme.id" :class="{ active: state.theme === theme.id }" :title="theme.name" @click="chooseTheme(theme.id)">
            <i :style="{ background: theme.colors[0] }" /><i :style="{ background: theme.colors[1] }" />
          </span>
        </div>
        <button class="user-card" @click="userOpen=!userOpen">
          <span class="avatar" :class="'role-'+currentUser?.role">{{ currentUser?.initials }}</span>
          <span><strong>{{ currentUser?.name }}</strong><small>{{ currentUser?.roleLabel }}</small></span>
          <Icon name="chevronDown" :size="15" />
        </button>
        <Transition name="pop">
          <div v-if="userOpen" class="user-menu">
            <div class="menu-title">切换演示角色</div>
            <button v-for="user in users" :key="user.id" :class="{ active: user.id === state.currentUserId }" @click="switchUser(user.id)">
              <span class="avatar small-avatar">{{ user.initials }}</span>
              <span><strong>{{ user.name }}</strong><small>{{ user.roleLabel }}</small></span>
              <Icon v-if="user.id === state.currentUserId" name="check" :size="15" />
            </button>
            <div class="menu-divider" />
            <button @click="doLogout"><Icon name="logout" :size="16" /><span><strong>退出登录</strong><small>返回角色选择页</small></span></button>
          </div>
        </Transition>
      </div>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="page-heading">
          <button class="icon-btn mobile-only" @click="mobileOpen=true"><Icon name="menu" /></button>
          <div><h1>{{ pageTitle }}</h1><p>{{ pageSubtitle }}</p></div>
        </div>
        <div class="top-actions">
          <form class="global-search" @submit.prevent="submitSearch">
            <Icon name="search" :size="16" />
            <input v-model="search" placeholder="搜索店铺、人头、结算单…" />
            <kbd>↵</kbd>
          </form>
          <div class="today-chip"><Icon name="history" :size="15" />{{ today }}</div>
          <button v-if="currentUser?.role!=='sub_agent'" class="icon-btn notification-btn" title="待处理提醒" @click="go('expenses')">
            <Icon name="bell" />
            <i v-if="unresolvedExpenses.length">{{ unresolvedExpenses.length }}</i>
          </button>
          <button class="avatar avatar-button" :class="'role-'+currentUser?.role" @click="userOpen=!userOpen">{{ currentUser?.initials }}</button>
        </div>
      </header>
      <div class="page-content"><router-view v-slot="{ Component }"><Transition name="page" mode="out-in"><component :is="Component" /></Transition></router-view></div>
    </main>
  </div>
</template>
