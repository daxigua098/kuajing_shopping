<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { users } from '@/data/seed'
import { authenticate, setTheme, state } from '@/store'
import type { ThemeId, UserAccount } from '@/types'

const router = useRouter()
const form = reactive({ username: '', password: '' })
const error = ref('')
const showPassword = ref(false)
const themes: { id: ThemeId; name: string }[] = [
  { id: 1, name: '指挥舱' },
  { id: 2, name: '海岛工作台' },
  { id: 3, name: '瑞士财务网格' },
  { id: 4, name: '代理关系图谱' },
]
const roleCopy: Record<UserAccount['role'], string> = {
  platform: '管理公司、代理、角色、权限与全平台审计',
  company: '发布任务、查店铺人头、确认结算和杂费',
  top_agent: '管理代理树、承接任务、提交人头给公司',
  sub_agent: '管理人头和店铺，提交人头给顶级代理',
}
const year = computed(() => new Date().getFullYear())
function fillDemo(user: UserAccount) {
  form.username = user.username
  form.password = user.demoPassword
  error.value = ''
}
function submitLogin() {
  error.value = ''
  if (!form.username.trim() || !form.password) {
    error.value = '请输入账号和密码'
    return
  }
  const result = authenticate(form.username, form.password)
  if (!result.ok) {
    error.value = result.reason
    return
  }
  router.push({ name: 'dashboard' })
}
function chooseTheme(id: ThemeId) {
  setTheme(id)
  document.documentElement.dataset.theme = String(id)
}
</script>
<template>
  <main class="login-page" :class="'theme-' + state.theme">
    <section class="login-panel">
      <div class="login-brand">
        <div class="brand-mark"><span>F</span></div>
        <div><strong>FenFlow</strong><small>跨境开店业务分发与代理分账平台</small></div>
      </div>
      <div class="login-copy">
        <div class="eyebrow">Secure account login</div>
        <h1>代理系统已启用账号密码登录。</h1>
        <p>顶级代理与子代理使用各自账号进入，系统会自动应用不同的代理树、人头提交、公司分配和店铺数据权限。</p>

        <form class="login-form" @submit.prevent="submitLogin">
          <div class="field">
            <label>登录账号</label>
            <input v-model="form.username" class="input login-input" autocomplete="username" placeholder="请输入账号" />
          </div>
          <div class="field">
            <label>登录密码</label>
            <div class="password-input">
              <input v-model="form.password" class="input login-input" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入密码" />
              <button type="button" class="icon-btn" @click="showPassword=!showPassword"><Icon name="eye" :size="16"/></button>
            </div>
          </div>
          <div v-if="error" class="callout danger login-error"><Icon name="alert" :size="16"/><div><strong>登录失败</strong><p>{{ error }}</p></div></div>
          <button class="btn primary login-submit" type="submit"><Icon name="shield" :size="16"/>安全登录</button>
        </form>

        <div class="demo-accounts">
          <div class="row between center" style="margin-bottom:9px"><strong>测试账号</strong><span class="hint">点击账号自动填入，再点击“安全登录”</span></div>
          <button v-for="user in users" :key="user.id" class="demo-account" @click="fillDemo(user)">
            <span class="avatar" :class="'role-'+user.role">{{ user.initials }}</span>
            <span style="flex:1"><strong>{{ user.roleLabel }} · {{ user.name }}</strong><small>{{ user.username }} / {{ user.demoPassword }}</small></span>
            <span class="hint">{{ roleCopy[user.role].slice(0, 12) }}…</span>
          </button>
        </div>

        <div class="page-toolbar" style="margin-top:16px">
          <span class="hint">演示密码仅用于当前本地原型；正式环境应使用 BCrypt / Argon2id 和 MFA。</span>
          <span class="spacer" />
          <div class="segmented">
            <button v-for="theme in themes" :key="theme.id" :class="{ active: state.theme === theme.id }" @click="chooseTheme(theme.id)">{{ theme.name }}</button>
          </div>
        </div>
      </div>
      <footer class="login-footer">
        <span>© {{ year }} FenFlow SaaS</span>
        <span>马来西亚 · 新加坡 · 泰国 · 越南</span>
      </footer>
    </section>
    <aside class="login-visual">
      <div class="visual-top"><span class="visual-chip">权限隔离已启用</span><span class="visual-chip">顶部代理 / 子代理</span></div>
      <div class="visual-dashboard">
        <div class="panel-bar" />
        <div class="visual-kpis">
          <div class="visual-kpi"><span>顶级代理账号</span><strong>topagent</strong></div>
          <div class="visual-kpi"><span>子代理账号</span><strong>subagent</strong></div>
          <div class="visual-kpi"><span>数据范围</span><strong>按代理树</strong></div>
        </div>
        <div class="visual-chart">
          <svg viewBox="0 0 500 100" preserveAspectRatio="none"><path d="M0 80 C45 76 65 43 105 54 S175 89 215 57 S280 29 322 45 S385 78 422 48 S466 30 500 19" fill="none" stroke="#16a18f" stroke-width="4" stroke-linecap="round"/><path d="M0 92 C60 85 88 70 133 76 S210 61 254 73 S330 59 370 76 S445 61 500 67" fill="none" stroke="#f08a63" stroke-width="3" stroke-dasharray="7 7"/></svg>
        </div>
      </div>
      <div class="visual-foot"><span>顶级代理：可管理代理树并分配公司</span><span>子代理：只能提交给顶级代理分配</span></div>
    </aside>
  </main>
</template>
