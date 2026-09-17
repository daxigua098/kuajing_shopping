import { computed, reactive, watch } from 'vue'
import { seedState, users } from '@/data/seed'
import type { Agent, AppState, AuditLog, Company, CompanySettlementConfig, CompanySettlementTemplate, CompanyShopType, DistributionRule, OpenTask, Owner, OwnerBusinessStatus, OwnerSubmission, OwnerSubmissionStatus, SettlementBatch, SettlementDetail, Shop, ShopExpense, ShopType, ThemeId, UserAccount } from '@/types'
import { calculateRent } from '@/utils/settlement'

const STORAGE_KEY = 'fenflow-state-v10'
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const load = (): AppState => {
  const fresh = seedState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...fresh,
      ...parsed,
      companies: parsed.companies || fresh.companies,
      agents: parsed.agents || fresh.agents,
      owners: parsed.owners || fresh.owners,
      ownerSubmissions: parsed.ownerSubmissions || fresh.ownerSubmissions,
      shopTypes: parsed.shopTypes || fresh.shopTypes,
      companyShopTypes: parsed.companyShopTypes || fresh.companyShopTypes,
      shops: parsed.shops || fresh.shops,
      companySettlementConfigs: parsed.companySettlementConfigs || fresh.companySettlementConfigs,
      companySettlementTemplates: parsed.companySettlementTemplates || fresh.companySettlementTemplates,
      tasks: parsed.tasks || fresh.tasks,
      rules: parsed.rules || fresh.rules,
      expenses: parsed.expenses || fresh.expenses,
      settlementBatches: parsed.settlementBatches || fresh.settlementBatches,
      settlementDetails: parsed.settlementDetails || fresh.settlementDetails,
      auditLogs: parsed.auditLogs || fresh.auditLogs,
    }
  } catch {
    return fresh
  }
}

export const state = reactive<AppState>(load())

watch(state, value => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}, { deep: true })

export const currentUser = computed(() => users.find(user => user.id === state.currentUserId) || null)
export const isLoggedIn = computed(() => Boolean(currentUser.value))

const descendants = (agentId: string): string[] => {
  const result = [agentId]
  let queue = [agentId]
  while (queue.length) {
    const parent = queue.shift()!
    const children = state.agents.filter(agent => agent.parentId === parent).map(agent => agent.id)
    queue = queue.concat(children)
    result.push(...children)
  }
  return [...new Set(result)]
}

export const visibleAgentIds = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.agents.map(agent => agent.id)
  if (user.role === 'company') return state.agents.filter(agent => agent.companyIds.includes(user.companyId || '')).map(agent => agent.id)
  return descendants(user.agentId || '')
})

export const visibleCompanies = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.companies
  if (user.role === 'company') return state.companies.filter(company => company.id === user.companyId)
  const ids = new Set(state.agents.filter(agent => visibleAgentIds.value.includes(agent.id)).flatMap(agent => agent.companyIds))
  return state.companies.filter(company => ids.has(company.id))
})

export const visibleAgents = computed(() => state.agents.filter(agent => visibleAgentIds.value.includes(agent.id)))
export const visibleOwners = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.owners
  if (user.role === 'company') {
    const submittedOwnerIds = new Set(state.ownerSubmissions.filter(submission => submission.companyId === user.companyId && ['pending', 'approved'].includes(submission.status)).map(submission => submission.ownerId))
    return state.owners.filter(owner => owner.companyId === user.companyId || submittedOwnerIds.has(owner.id))
  }
  return state.owners.filter(owner => visibleAgentIds.value.includes(owner.agentId))
})
export const visibleShops = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.shops
  if (user.role === 'company') return state.shops.filter(shop => shop.companyId === user.companyId)
  return state.shops.filter(shop => visibleAgentIds.value.includes(shop.agentId))
})
export const visibleSubmissions = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.ownerSubmissions
  if (user.role === 'company') return state.ownerSubmissions.filter(submission => submission.companyId === user.companyId)
  return state.ownerSubmissions.filter(submission => visibleAgentIds.value.includes(submission.fromAgentId))
})
export const visibleShopTypes = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.companyShopTypes
  if (user.role === 'company') return state.companyShopTypes.filter(type => type.companyId === user.companyId)
  if (user.role === 'top_agent') return state.companyShopTypes.filter(type => visibleCompanies.value.some(company => company.id === type.companyId))
  return state.companyShopTypes.filter(type => visibleShops.value.some(shop => shop.shopTypeId === type.id))
})
export const visibleCompanySettlementTemplates = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.companySettlementTemplates
  if (user.role === 'company') return state.companySettlementTemplates.filter(template => template.companyId === user.companyId)
  return []
})
export const visibleCompanySettlementConfigs = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.companySettlementConfigs
  if (user.role === 'company') return state.companySettlementConfigs.filter(config => config.companyId === user.companyId && visibleShops.value.some(shop => shop.id === config.shopId))
  return []
})
export const visibleExpenses = computed(() => state.expenses.filter(expense => visibleShops.value.some(shop => shop.id === expense.shopId) || currentUser.value?.role === 'platform'))
export const visibleBatches = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.settlementBatches
  const batchIds = new Set(state.settlementDetails.filter(detail => {
    if (user.role === 'company') return detail.companyId === user.companyId
    return visibleAgentIds.value.includes(detail.agentId)
  }).map(detail => detail.batchId))
  return state.settlementBatches.filter(batch => batchIds.has(batch.id))
})
export const visibleTaskList = computed(() => {
  const user = currentUser.value
  if (!user) return []
  if (user.role === 'platform') return state.tasks
  if (user.role === 'company') return state.tasks.filter(task => task.companyId === user.companyId)
  if (user.role === 'sub_agent') return []
  return state.tasks.filter(task => task.status === 'open' || (task.claimedBy && visibleAgentIds.value.includes(task.claimedBy)))
})
export const visibleRules = computed(() => state.rules.filter(rule => visibleAgentIds.value.includes(rule.agentId) && visibleCompanies.value.some(company => company.id === rule.companyId)))

export const unresolvedExpenses = computed(() => visibleExpenses.value.filter(expense => expense.status === 'pending'))
export const activeShopCount = computed(() => visibleShops.value.filter(shop => shop.status === 'operating' || shop.status === 'paused').length)
export const dashboardMetrics = computed(() => {
  const shops = visibleShops.value
  const owners = visibleOwners.value
  const expenses = visibleExpenses.value
  const batch = visibleBatches.value[0]
  const rent = shops.reduce((sum, shop) => sum + (shop.status === 'closed' ? 0 : shop.monthlyRent), 0)
  const expense = expenses.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
  const alive = shops.filter(shop => shop.status !== 'closed').length
  return {
    rent,
    expense,
    total: rent + expense,
    shops: shops.length,
    owners: owners.length,
    alive,
    health: shops.length ? Math.round(alive / shops.length * 100) : 0,
    pendingExpenses: expenses.filter(item => item.status === 'pending').length,
    unresolved: expenses.filter(item => item.status === 'pending').length,
    batch,
    confirmed: visibleBatches.value.length ? Math.round(visibleBatches.value.filter(b => b.status !== 'draft').length / visibleBatches.value.length * 100) : 0,
  }
})

export const can = (permission: string) => {
  const role = currentUser.value?.role
  const matrix: Record<string, string[]> = {
    manageCompanies: ['platform'],
    publishTask: ['platform', 'company'],
    viewTasks: ['platform', 'company', 'top_agent'],
    viewExpenses: ['platform', 'company', 'top_agent'],
    viewReconciliation: ['platform', 'company', 'top_agent'],
    viewReports: ['platform', 'company', 'top_agent'],
    manageCompanySettlement: ['platform', 'company'],
    manageShopTypes: ['platform', 'company'],
    manageAgents: ['platform', 'top_agent'],
    createTopAgent: ['platform'],
    manageOwners: ['platform', 'top_agent', 'sub_agent'],
    manageShops: ['platform', 'company'],
    submitOwnerToCompany: ['platform', 'top_agent'],
    reviewOwnerSubmission: ['platform', 'company'],
    manageExpenses: ['platform', 'top_agent'],
    settle: ['platform', 'company', 'top_agent'],
    companyPayment: ['platform', 'company'],
    confirmExpense: ['platform', 'company'],
    uploadExpenseProof: ['platform', 'company', 'top_agent'],
    viewAudit: ['platform'],
    export: ['platform', 'company', 'top_agent', 'sub_agent'],
  }
  return Boolean(role && matrix[permission]?.includes(role))
}

export function addAudit(action: string, target: string, detail: string) {
  const user = currentUser.value
  state.auditLogs.unshift({
    id: 'l' + Date.now(),
    action,
    target,
    operator: user?.name || '系统',
    role: user?.roleLabel || '系统',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    detail,
  } as AuditLog)
}

export function authenticate(username: string, password: string) {
  const user = users.find(item => item.username.toLowerCase() === username.trim().toLowerCase())
  if (!user) return { ok: false, reason: '账号不存在' }
  if (user.demoPassword !== password) return { ok: false, reason: '密码错误，请重新输入' }
  login(user)
  return { ok: true, reason: '' }
}

export function login(user: UserAccount) {
  state.currentUserId = user.id
  state.language = user.language
  addAudit('登录系统', user.name, user.roleLabel + '登录平台')
}

export function logout() {
  if (currentUser.value) addAudit('退出系统', currentUser.value.name, '用户主动退出')
  state.currentUserId = null
}

export function setTheme(theme: ThemeId) {
  state.theme = theme
  localStorage.setItem('fenflow-theme', String(theme))
}

export function setLanguage(language: AppState['language']) {
  state.language = language
  if (currentUser.value) currentUser.value.language = language
}

export function companyName(id: string) { return state.companies.find(item => item.id === id)?.name || id }
export function agentName(id: string) { return state.agents.find(item => item.id === id)?.name || id }
export function ownerName(id: string) { return state.owners.find(item => item.id === id)?.name || id }
export function shopTypeName(id: string) { return state.companyShopTypes.find(item => item.id === id)?.name || state.shopTypes.find(item => item.id === id)?.name || id }
export function shopName(id: string) { return state.shops.find(item => item.id === id)?.name || id }

export function saveCompany(company: Company) {
  const index = state.companies.findIndex(item => item.id === company.id)
  if (index >= 0) state.companies[index] = clone(company)
  else state.companies.unshift(clone(company))
  addAudit(index >= 0 ? '编辑公司' : '新增公司', company.name, company.region)
}
export function deleteCompany(id: string) {
  const item = state.companies.find(company => company.id === id)
  state.companies = state.companies.filter(company => company.id !== id)
  if (item) addAudit('停用公司', item.name, '已从当前数据视图移除')
}
export function saveAgent(agent: Agent) {
  const index = state.agents.findIndex(item => item.id === agent.id)
  const actor = currentUser.value
  if (!actor || !['platform', 'top_agent'].includes(actor.role)) return
  if (actor.role === 'top_agent') {
    const rootId = actor.agentId || ''
    const allowedParents = descendants(rootId)
    const existing = index >= 0 ? state.agents[index] : null
    if (!agent.parentId || !allowedParents.includes(agent.parentId) || (existing && existing.id === rootId)) {
      addAudit('权限拒绝', agent.name, '顶级代理只能在自己的代理树下新增或编辑子代理')
      return
    }
  }
  if (index >= 0) state.agents[index] = clone(agent)
  else state.agents.unshift(clone(agent))
  addAudit(index >= 0 ? '编辑代理' : '新增代理', agent.name, '层级 ' + agent.level)
}
export function deleteAgent(id: string) {
  const item = state.agents.find(agent => agent.id === id)
  const actor = currentUser.value
  if (!item || !actor) return
  if (actor.role === 'top_agent' && (item.id === actor.agentId || !descendants(actor.agentId || '').includes(item.id))) {
    addAudit('权限拒绝', item.name, '顶级代理不能停用自己或代理树之外的代理')
    return
  }
  state.agents = state.agents.filter(agent => agent.id !== id)
  addAudit('停用代理', item.name, '代理及其数据从当前视图移除')
}
export function ownerBusinessStatus(owner: Owner): OwnerBusinessStatus {
  if (owner.isInvalid) return 'invalid'
  const ownerShops = state.shops.filter(shop => shop.ownerId === owner.id)
  if (ownerShops.some(shop => shop.status !== 'closed')) return 'opened'
  if (ownerShops.length) return 'dead_shop'
  return 'not_opened'
}

export function ownerBusinessStatusLabel(owner: Owner) {
  const labels: Record<OwnerBusinessStatus, string> = { not_opened: '未开店', opened: '已开店', dead_shop: '死店', invalid: '无效人头' }
  return labels[ownerBusinessStatus(owner)]
}

export function validateOwnerSubmission(ownerId: string, companyId: string, shopTypeId: string, ignoreSubmissionId = '') {
  const owner = state.owners.find(item => item.id === ownerId)
  if (!owner) return { ok: false, reason: '人头不存在' }
  if (owner.isInvalid) return { ok: false, reason: '无效人头不能提交' }
  if (!visibleAgentIds.value.includes(owner.agentId)) return { ok: false, reason: '无权提交该人头' }
  const history = state.ownerSubmissions.filter(item => item.ownerId === ownerId)
  if (history.some(item => item.id !== ignoreSubmissionId && ['pending_top', 'pending'].includes(item.status))) return { ok: false, reason: '该人头已有待审核提交，请先取消原提交' }
  const approvedCompany = history.find(item => item.status === 'approved')?.companyId
  if (approvedCompany && approvedCompany !== companyId) return { ok: false, reason: '该人头已由其他公司审核使用，不能再提交给其他公司' }
  if (history.some(item => item.id !== ignoreSubmissionId && item.status === 'approved' && item.shopTypeId === shopTypeId)) return { ok: false, reason: '该人头已经提交过相同店铺类型' }
  if (state.shops.some(shop => shop.ownerId === ownerId && shop.shopTypeId === shopTypeId)) return { ok: false, reason: '该人头已经开过相同类型的店铺' }
  return { ok: true, reason: '' }
}

export function submitOwnerToTop(ownerId: string, shopTypeId: string, remark = '') {
  const owner = state.owners.find(item => item.id === ownerId)
  const actor = currentUser.value
  if (!owner || !actor || !visibleAgentIds.value.includes(owner.agentId)) return { ok: false, reason: '无权提交该人头' }
  if (owner.isInvalid) return { ok: false, reason: '无效人头不能提交' }
  const history = state.ownerSubmissions.filter(item => item.ownerId === ownerId)
  if (history.some(item => ['pending_top', 'pending'].includes(item.status))) return { ok: false, reason: '该人头已有待审核提交' }
  if (history.some(item => item.status === 'approved' && item.shopTypeId === shopTypeId)) return { ok: false, reason: '该人头已经提交过相同店铺类型' }
  if (state.shops.some(shop => shop.ownerId === ownerId && shop.shopTypeId === shopTypeId)) return { ok: false, reason: '该人头已经开过相同类型的店铺' }
  state.ownerSubmissions.unshift({
    id: 'os' + Date.now(), ownerId, fromAgentId: owner.agentId, companyId: '', shopTypeId,
    status: 'pending_top', submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    reviewedAt: null, reviewedBy: null, remark: remark || '子代理提交，等待顶级代理分配给公司',
  })
  addAudit('提交人头给顶级代理', owner.name, '店铺类型：' + shopTypeName(shopTypeId))
  return { ok: true, reason: '' }
}

export function assignOwnerSubmissionToCompany(id: string, companyId: string, remark = '') {
  const submission = state.ownerSubmissions.find(item => item.id === id)
  const actor = currentUser.value
  if (!submission || !actor || submission.status !== 'pending_top') return { ok: false, reason: '该提交不在待分配状态' }
  if (actor.role !== 'platform' && actor.role !== 'top_agent') return { ok: false, reason: '只有顶级代理可以分配公司' }
  const result = validateOwnerSubmission(submission.ownerId, companyId, submission.shopTypeId, submission.id)
  if (!result.ok) return result
  submission.companyId = companyId
  submission.status = 'pending'
  submission.remark = remark || submission.remark
  const owner = state.owners.find(item => item.id === submission.ownerId)
  addAudit('分配人头给公司', owner?.name || submission.ownerId, companyName(companyId) + ' · ' + shopTypeName(submission.shopTypeId))
  return { ok: true, reason: '' }
}

export function submitOwnerToCompany(ownerId: string, companyId: string, shopTypeId: string, remark = '') {
  const result = validateOwnerSubmission(ownerId, companyId, shopTypeId)
  if (!result.ok) return result
  const owner = state.owners.find(item => item.id === ownerId)!
  const submission: OwnerSubmission = {
    id: 'os' + Date.now(),
    ownerId,
    fromAgentId: owner.agentId,
    companyId,
    shopTypeId,
    status: 'pending',
    submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    reviewedAt: null,
    reviewedBy: null,
    remark,
  }
  state.ownerSubmissions.unshift(submission)
  addAudit('提交人头给公司', owner.name + ' → ' + companyName(companyId), '店铺类型：' + shopTypeName(shopTypeId) + (remark ? '；备注：' + remark : ''))
  return { ok: true, reason: '' }
}

export function cancelOwnerSubmission(id: string) {
  const submission = state.ownerSubmissions.find(item => item.id === id)
  const actor = currentUser.value
  if (!submission || !['pending_top', 'pending'].includes(submission.status)) return
  if (!actor || (actor.role !== 'platform' && submission.fromAgentId !== actor.agentId && !visibleAgentIds.value.includes(submission.fromAgentId))) return
  submission.status = 'cancelled'
  submission.reviewedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  submission.reviewedBy = actor.name
  const owner = state.owners.find(item => item.id === submission.ownerId)
  if (owner && !state.ownerSubmissions.some(item => item.ownerId === owner.id && item.id !== submission.id && item.status === 'approved')) owner.companyId = ''
  addAudit('取消人头提交', owner?.name || submission.ownerId, '待审核提交已取消，可改选其他公司')
}

export function reviewOwnerSubmission(id: string, status: Extract<OwnerSubmissionStatus, 'approved' | 'rejected'>, remark = '') {
  const submission = state.ownerSubmissions.find(item => item.id === id)
  const actor = currentUser.value
  if (!submission || submission.status !== 'pending' || !actor) return
  if (actor.role !== 'platform' && (actor.role !== 'company' || submission.companyId !== actor.companyId)) return
  submission.status = status
  submission.reviewedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  submission.reviewedBy = actor.name
  submission.remark = remark || submission.remark
  const owner = state.owners.find(item => item.id === submission.ownerId)
  if (owner) owner.companyId = status === 'approved' ? submission.companyId : ''
  addAudit(status === 'approved' ? '审核通过人头提交' : '驳回头人提交', owner?.name || submission.ownerId, status === 'approved' ? '公司可安排开店' : (remark || '资料不符合要求'))
}

export function saveOwner(owner: Owner) {
  const index = state.owners.findIndex(item => item.id === owner.id)
  const actor = currentUser.value
  if (!actor || !['platform', 'top_agent', 'sub_agent'].includes(actor.role)) return
  if (actor.role !== 'platform' && !visibleAgentIds.value.includes(owner.agentId)) {
    addAudit('权限拒绝', owner.name, '代理只能录入自己代理树下的人头')
    return
  }
  if (index >= 0) state.owners[index] = clone(owner)
  else state.owners.unshift(clone(owner))
  addAudit(index >= 0 ? '编辑人头资料' : '录入人头资料', owner.name, agentName(owner.agentId))
}
export function deleteOwner(id: string) {
  const item = state.owners.find(owner => owner.id === id)
  const actor = currentUser.value
  if (!item || !actor) return
  if (actor.role !== 'platform' && !visibleAgentIds.value.includes(item.agentId)) {
    addAudit('权限拒绝', item.name, '不能删除代理树之外的人头')
    return
  }
  state.owners = state.owners.filter(owner => owner.id !== id)
  addAudit('停用人头', item.name, '资料状态变更为停用')
}
export function saveShop(shop: Shop) {
  const index = state.shops.findIndex(item => item.id === shop.id)
  const actor = currentUser.value
  if (!actor) return { ok: false, reason: '登录状态已失效' }
  if (state.shops.some(item => item.id !== shop.id && item.ownerId === shop.ownerId && item.shopTypeId === shop.shopTypeId)) {
    addAudit('拒绝开店', shop.code, '该人头已经拥有相同类型的店铺')
    return { ok: false, reason: '该人头已经拥有相同类型的店铺，不能重复开店' }
  }
  if (actor.role === 'company') {
    const approved = state.ownerSubmissions.some(item => item.ownerId === shop.ownerId && item.companyId === actor.companyId && item.shopTypeId === shop.shopTypeId && item.status === 'approved')
    if (!approved) {
      addAudit('拒绝开店', shop.code, '公司只能为已审核通过的人头开店')
      return { ok: false, reason: '该人头尚未审核通过给本公司对应店铺类型，不能开店' }
    }
    shop.companyId = actor.companyId || shop.companyId
  }
  if (shop.closeDate) shop.status = 'closed'
  if (index >= 0) state.shops[index] = clone(shop)
  else state.shops.unshift(clone(shop))
  addAudit(index >= 0 ? '编辑店铺' : '新增店铺', shop.code, shopName(shop.id))
  return { ok: true, reason: '' }
}
export function setShopStatus(id: string, status: Shop['status']) {
  const shop = state.shops.find(item => item.id === id)
  if (!shop) return
  shop.status = status
  if (status === 'closed') shop.closeDate = new Date().toISOString().slice(0, 10)
  else shop.closeDate = null
  addAudit('变更店铺状态', shop.code, '状态更新为 ' + status)
}
export function deleteShop(id: string) {
  const item = state.shops.find(shop => shop.id === id)
  state.shops = state.shops.filter(shop => shop.id !== id)
  if (item) addAudit('删除店铺', item.code, item.name)
}
export function saveTask(task: OpenTask) {
  const index = state.tasks.findIndex(item => item.id === task.id)
  if (index >= 0) state.tasks[index] = clone(task)
  else state.tasks.unshift(clone(task))
  addAudit(index >= 0 ? '编辑开店任务' : '发布开店任务', task.title, '数量 ' + task.quantity)
}
export function claimTask(id: string) {
  const task = state.tasks.find(item => item.id === id)
  const user = currentUser.value
  if (!task || !user?.agentId) return
  task.claimedBy = user.agentId
  task.status = 'claimed'
  addAudit('承接开店任务', task.title, agentName(user.agentId) + ' 已承接')
}
export function updateTaskProgress(id: string, completed: number) {
  const task = state.tasks.find(item => item.id === id)
  if (!task) return
  task.completed = Math.min(task.quantity, Math.max(0, completed))
  if (task.completed >= task.quantity) task.status = 'completed'
  addAudit('更新任务进度', task.title, task.completed + ' / ' + task.quantity)
}
export function saveRule(rule: DistributionRule) {
  const index = state.rules.findIndex(item => item.id === rule.id)
  if (index >= 0) state.rules[index] = clone(rule)
  else state.rules.unshift(clone(rule))
  addAudit(index >= 0 ? '编辑分配规则' : '新增分配规则', agentName(rule.agentId), '版本 v' + rule.version)
}
export function deleteRule(id: string) {
  const item = state.rules.find(rule => rule.id === id)
  state.rules = state.rules.filter(rule => rule.id !== id)
  if (item) addAudit('删除分配规则', agentName(item.agentId), '规则 ID ' + item.id)
}
export function saveCompanyShopType(type: CompanyShopType) {
  const actor = currentUser.value
  if (!actor || !['platform', 'company'].includes(actor.role)) return { ok: false, reason: '无权管理店铺类型' }
  if (actor.role === 'company') type.companyId = actor.companyId || type.companyId
  if (!type.name.trim()) return { ok: false, reason: '请填写店铺类型名称' }
  const index = state.companyShopTypes.findIndex(item => item.id === type.id)
  if (index >= 0) state.companyShopTypes[index] = clone(type)
  else state.companyShopTypes.unshift(clone(type))
  addAudit(index >= 0 ? '编辑店铺类型' : '新增店铺类型', type.name, type.platformCode)
  return { ok: true, reason: '' }
}

export function deleteCompanyShopType(id: string) {
  const type = state.companyShopTypes.find(item => item.id === id)
  const actor = currentUser.value
  if (!type || !actor) return { ok: false, reason: '店铺类型不存在' }
  if (actor.role === 'company' && type.companyId !== actor.companyId) return { ok: false, reason: '无权删除其他公司的店铺类型' }
  const aliveShops = state.shops.filter(shop => shop.shopTypeId === id && shop.status !== 'closed')
  if (aliveShops.length) return { ok: false, reason: '该类型下还有 ' + aliveShops.length + ' 家存活店铺，不能删除' }
  state.companyShopTypes = state.companyShopTypes.filter(item => item.id !== id)
  addAudit('删除店铺类型', type.name, '该类型下无存活店铺')
  return { ok: true, reason: '' }
}

export function saveCompanySettlementTemplate(template: CompanySettlementTemplate) {
  const actor = currentUser.value
  if (!actor || !['platform', 'company'].includes(actor.role)) return { ok: false, reason: '无权新增结算模式分类' }
  if (actor.role === 'company') template.companyId = actor.companyId || template.companyId
  if (!template.name.trim()) return { ok: false, reason: '请填写结算模式名称' }
  if (template.amount <= 0) return { ok: false, reason: '结算金额必须大于 0' }
  const index = state.companySettlementTemplates.findIndex(item => item.id === template.id)
  const next = clone({ ...template, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), createdBy: template.createdBy || actor.name })
  if (index >= 0) state.companySettlementTemplates[index] = next
  else state.companySettlementTemplates.unshift(next)
  addAudit(index >= 0 ? '编辑公司结算模式分类' : '新增公司结算模式分类', template.name, template.mode === 'one_time' ? '一次性 ' + template.amount : '按月 ' + template.amount)
  return { ok: true, reason: '' }
}

export function saveCompanySettlementConfig(config: CompanySettlementConfig) {
  const actor = currentUser.value
  if (!actor || !['platform', 'company'].includes(actor.role)) return { ok: false, reason: '无权设置公司结算模式' }
  if (actor.role === 'company') config.companyId = actor.companyId || config.companyId
  const shop = state.shops.find(item => item.id === config.shopId)
  if (!shop || shop.companyId !== config.companyId) return { ok: false, reason: '店铺不属于当前公司' }
  const index = state.companySettlementConfigs.findIndex(item => item.id === config.id || item.shopId === config.shopId)
  const next = clone({ ...config, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), updatedBy: actor.name })
  if (index >= 0) state.companySettlementConfigs[index] = next
  else state.companySettlementConfigs.unshift(next)
  addAudit('设置公司结算模式', shop.code, (config.mode === 'one_time' ? '一次性 ' : '按月 ') + config.currency + ' ' + config.amount)
  return { ok: true, reason: '' }
}

export function saveExpense(expense: ShopExpense) {
  const index = state.expenses.findIndex(item => item.id === expense.id)
  if (index >= 0) state.expenses[index] = clone(expense)
  else state.expenses.unshift(clone(expense))
  addAudit(index >= 0 ? '编辑杂费' : '录入杂费', shopName(expense.shopId), expense.purpose + ' · RM' + expense.amount)
}
export function settleExpense(id: string, status: ShopExpense['status']) {
  const expense = state.expenses.find(item => item.id === id)
  if (!expense) return
  expense.status = status
  addAudit(status === 'settled' ? '确认杂费报销' : '驳回杂费', shopName(expense.shopId), expense.purpose)
}
export function deleteExpense(id: string) {
  const item = state.expenses.find(expense => expense.id === id)
  state.expenses = state.expenses.filter(expense => expense.id !== id)
  if (item) addAudit('删除杂费', shopName(item.shopId), item.purpose)
}

export function generateSettlement(month: string): SettlementBatch {
  const existing = state.settlementBatches.find(batch => batch.month === month && batch.status !== 'paid')
  const candidates = visibleShops.value
  const details: SettlementDetail[] = candidates.map(shop => {
    const calculated = calculateRent(shop, month, state.rules)
    const expenses = state.expenses.filter(expense => expense.shopId === shop.id && expense.expenseMonth === month && expense.status === 'pending')
    return {
      id: 'd' + Date.now() + '-' + shop.id,
      batchId: existing?.id || 'b' + month.replace('-', ''),
      shopId: shop.id,
      companyId: shop.companyId,
      agentId: shop.agentId,
      ownerId: shop.ownerId,
      mode: calculated.mode,
      rent: calculated.rent,
      expense: expenses.reduce((sum, item) => sum + item.amount, 0),
      status: 'draft',
      reason: calculated.reason,
    }
  })
  const batch: SettlementBatch = {
    id: existing?.id || 'b' + month.replace('-', ''),
    month,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    createdBy: currentUser.value?.name || '系统',
    status: 'draft',
    shopCount: details.filter(detail => detail.rent > 0 || detail.expense > 0).length,
    rentTotal: details.reduce((sum, detail) => sum + detail.rent, 0),
    expenseTotal: details.reduce((sum, detail) => sum + detail.expense, 0),
    payableTotal: details.reduce((sum, detail) => sum + detail.rent + detail.expense, 0),
    ruleVersion: 'v' + Math.max(...state.rules.map(rule => rule.version), 0),
    confirmedAt: null,
    paidAt: null,
    note: '重新生成的月度批次，凭证待确认',
  }
  const batchIndex = state.settlementBatches.findIndex(item => item.id === batch.id)
  if (batchIndex >= 0) state.settlementBatches[batchIndex] = batch
  else state.settlementBatches.unshift(batch)
  state.settlementDetails = state.settlementDetails.filter(detail => detail.batchId !== batch.id).concat(details)
  addAudit('生成核算批次', month + ' 月度核算', '生成 ' + batch.shopCount + ' 条店铺明细')
  return batch
}

export function confirmSettlement(id: string) {
  const batch = state.settlementBatches.find(item => item.id === id)
  if (!batch) return
  batch.status = 'confirmed'
  batch.confirmedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  state.settlementDetails.filter(detail => detail.batchId === id).forEach(detail => detail.status = 'confirmed')
  addAudit('确认核算批次', batch.month, '应结 ' + batch.payableTotal.toFixed(2))
}

export function paySettlement(id: string) {
  const batch = state.settlementBatches.find(item => item.id === id)
  if (!batch || batch.status !== 'confirmed') return
  batch.status = 'paid'
  batch.paidAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  state.settlementDetails.filter(detail => detail.batchId === id).forEach(detail => detail.status = 'paid')
  state.expenses.filter(expense => expense.expenseMonth === batch.month && expense.status === 'pending').forEach(expense => expense.status = 'settled')
  addAudit('登记支付', batch.month, '支付完成 ' + batch.payableTotal.toFixed(2))
}

export function resetDemoData() {
  const fresh = seedState()
  Object.assign(state, fresh)
  addAudit('重置演示数据', '全部业务数据', '已恢复到初始演示状态')
}
