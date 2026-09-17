<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { currentUser, deleteAgent, saveAgent, state, visibleAgents, visibleCompanies, visibleOwners, visibleShops, visibleSubmissions } from '@/store'
import type { Agent } from '@/types'
import { downloadRows } from '@/utils/export'

const router = useRouter()
const search = ref('')
const metricShopType = ref('all')
const selectedId = ref('')
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const collapsed = reactive<Record<string, boolean>>({})
const form = reactive<Agent>({ id:'',name:'',parentId:null,level:1,agentType:'sub',companyIds:[],contact:'',status:'active',createdAt:'' })
const filteredIds = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return new Set(visibleAgents.value.map(agent => agent.id))
  const direct = visibleAgents.value.filter(agent => [agent.name,agent.contact,agent.id].some(value => value.toLowerCase().includes(keyword))).map(agent => agent.id)
  const withAncestors = new Set<string>(direct)
  direct.forEach(id => {
    let current = visibleAgents.value.find(agent => agent.id === id)
    while (current?.parentId) { withAncestors.add(current.parentId); current = visibleAgents.value.find(agent => agent.id === current?.parentId) }
  })
  return withAncestors
})
const currentAgent = computed(() => visibleAgents.value.find(agent => agent.id === currentUser.value?.agentId))
const roots = computed(() => {
  if (currentUser.value?.role === 'top_agent' && currentAgent.value) {
    return visibleAgents.value.filter(agent => agent.parentId === currentAgent.value?.id)
  }
  return visibleAgents.value.filter(agent => !agent.parentId || !visibleAgents.value.some(parent => parent.id === agent.parentId))
})
const directAgents = computed(() => currentAgent.value ? visibleAgents.value.filter(agent => agent.parentId === currentAgent.value?.id) : [])
const selected = computed(() => visibleAgents.value.find(agent => agent.id === selectedId.value) || roots.value[0])
const canManageSelected = computed(() => Boolean(selected.value && (currentUser.value?.role === 'platform' || selected.value.id !== currentAgent.value?.id)))
function children(id: string) { return visibleAgents.value.filter(agent => agent.parentId === id && filteredIds.value.has(agent.id)) }
function descendantIdsFor(agentId: string) {
  const ids = new Set<string>([agentId])
  let queue = [agentId]
  while (queue.length) {
    const parent = queue.shift()!
    const childIds = visibleAgents.value.filter(agent => agent.parentId === parent).map(agent => agent.id)
    childIds.forEach(id => { if (!ids.has(id)) { ids.add(id); queue.push(id) } })
  }
  return ids
}
function metricsFor(agentId: string, shopTypeId = metricShopType.value) {
  const ids = descendantIdsFor(agentId)
  const shops = visibleShops.value.filter(shop => ids.has(shop.agentId) && (shopTypeId === 'all' || shop.shopTypeId === shopTypeId))
  const owners = visibleOwners.value.filter(owner => ids.has(owner.agentId) && !owner.isInvalid)
  const submitted = new Set(visibleSubmissions.value.filter(item => ids.has(item.fromAgentId) && ['pending', 'approved'].includes(item.status) && (shopTypeId === 'all' || item.shopTypeId === shopTypeId)).map(item => item.ownerId))
  const openedOwnerIds = new Set(shops.map(shop => shop.ownerId))
  return {
    points: shops.length,
    submitted: submitted.size,
    alive: shops.filter(shop => shop.status !== 'closed').length,
    dead: shops.filter(shop => shop.status === 'closed').length,
    unopened: owners.filter(owner => !openedOwnerIds.has(owner.id)).length,
  }
}
function typeName(id: string) { return state.shopTypes.find(type => type.id === id)?.name || id }
function breakdownFor(agentId: string) { return state.shopTypes.map(type => ({ type, metrics: metricsFor(agentId, type.id) })) }
function openCreate(parent?: Agent) {
  editingId.value = null
  const resolvedParent = currentUser.value?.role === 'top_agent' ? currentAgent.value : parent
  Object.assign(form, { id:'a'+Date.now(),name:'',parentId:resolvedParent?.id || null,level:(resolvedParent?.level || 0)+1,agentType:resolvedParent?'sub':'top',companyIds:resolvedParent?.companyIds || visibleCompanies.value.map(company => company.id),contact:'',status:'active' as const,createdAt:new Date().toISOString().slice(0,10) })
  modalOpen.value = true
}
function openEdit(agent: Agent) {
  editingId.value = agent.id
  Object.assign(form, JSON.parse(JSON.stringify(agent)))
  modalOpen.value = true
}
function submit() {
  if (!form.name.trim()) return
  saveAgent({ ...form, companyIds: [...form.companyIds] })
  modalOpen.value = false
  selectedId.value = form.id
}
function remove(agent: Agent) {
  if (window.confirm('确定停用代理「' + agent.name + '」吗？已有店铺和人头数据不会被删除。')) deleteAgent(agent.id)
}
function exportAgents() {
  downloadRows('代理体系-' + new Date().toISOString().slice(0,10), ['代理ID','名称','上级','层级','类型','公司','联系人','开店总点','提交人头','存活店','挂店/死店','未开店人数'], visibleAgents.value.map(agent => { const metrics=metricsFor(agent.id); return [agent.id,agent.name,agent.parentId||'顶级',agent.level,agent.agentType==='top'?'顶级代理':'子代理',agent.companyIds.join('/'),agent.contact,metrics.points,metrics.submitted,metrics.alive,metrics.dead,metrics.unopened] }), 'csv')
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索代理名称或联系人"/></div>
      <select v-model="metricShopType" class="select" style="width:180px"><option value="all">全部店铺类型</option><option v-for="type in state.shopTypes" :key="type.id" :value="type.id">{{ type.name }}</option></select>
      <span class="spacer" />
      <button class="btn secondary" @click="exportAgents"><Icon name="download" :size="15"/>导出代理表</button>
      <button v-if="currentUser?.role==='top_agent'" class="btn secondary" @click="router.push({name:'owners',query:{create:'1',agentId:currentAgent?.id||''}})"><Icon name="users" :size="15"/>录入本人直管人头</button><button v-if="currentUser?.role==='platform'" class="btn primary" @click="openCreate()"><Icon name="plus" :size="15"/>新增顶级代理</button><button v-else class="btn primary" @click="openCreate(currentAgent)"><Icon name="plus" :size="15"/>新增子代理</button>
    </div>
    <section v-if="currentUser?.role==='top_agent'" class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">直属代理</span><span class="stat-icon"><Icon name="network" :size="16"/></span></div><div class="stat-value">{{ directAgents.length }}</div><div class="stat-foot">由 {{ currentAgent?.name || '当前顶级代理' }} 直接管理</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">全部下级代理</span><span class="stat-icon"><Icon name="users" :size="16"/></span></div><div class="stat-value">{{ Math.max(0, visibleAgents.length - 1) }}</div><div class="stat-foot">包含直属和更深层代理</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">名下店铺</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleShops.length }}</div><div class="stat-foot">当前顶级代理树全部店铺</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">名下人头</span><span class="stat-icon"><Icon name="users" :size="16"/></span></div><div class="stat-value">{{ visibleOwners.length }}</div><div class="stat-foot">可用于提交公司</div></article>
    </section>
    <section class="grid-2">
      <article class="card card-pad">
        <div class="card-head"><div><h3>代理关系树</h3><p>统计口径：本代理及全部下级；{{ metricShopType==='all' ? '全部店铺类型' : typeName(metricShopType) }}</p></div><span class="badge info no-dot">{{ visibleAgents.length }} 个节点</span></div>
        <div class="tree">
          <div v-for="root in roots" :key="root.id" class="tree-node">
            <div class="tree-row" :style="{background:selectedId===root.id?'var(--surface-2)':''}" @click="selectedId=root.id">
              <button class="tree-toggle" @click.stop="collapsed[root.id]=!collapsed[root.id]">{{ collapsed[root.id] ? '+' : '−' }}</button>
              <span class="avatar" :class="'role-'+(root.agentType==='top'?'top_agent':'sub_agent')">{{ root.name.slice(0,1) }}</span>
              <div class="tree-meta"><strong>{{ root.name }} <span v-if="root.parentId===currentAgent?.id" class="badge info no-dot">直属</span></strong><small>{{ root.agentType==='top' ? '顶级代理' : '直属代理' }} · {{ root.contact }}</small></div>
              <div class="tree-stats metrics"><span><b>{{ metricsFor(root.id).points }}</b><small>开点</small></span><span><b>{{ metricsFor(root.id).submitted }}</b><small>提交</small></span><span><b>{{ metricsFor(root.id).alive }}</b><small>存活</small></span><span><b>{{ metricsFor(root.id).dead }}</b><small>挂店</small></span><span><b>{{ metricsFor(root.id).unopened }}</b><small>未开</small></span></div>
            </div>
            <div v-if="!collapsed[root.id]" class="tree-children">
              <div v-for="agent in children(root.id)" :key="agent.id" class="tree-node">
                <div class="tree-row" :style="{background:selectedId===agent.id?'var(--surface-2)':''}" @click="selectedId=agent.id">
                  <span class="tree-toggle" @click.stop="collapsed[agent.id]=!collapsed[agent.id]">{{ children(agent.id).length ? (collapsed[agent.id]?'+':'−') : '·' }}</span>
                  <span class="avatar" :class="'role-sub_agent'">{{ agent.name.slice(0,1) }}</span>
                  <div class="tree-meta"><strong>{{ agent.name }} <span v-if="agent.parentId===currentAgent?.id" class="badge info no-dot">直属</span></strong><small>层级 {{ agent.level }} · {{ agent.contact }}</small></div>
                  <div class="tree-stats metrics"><span><b>{{ metricsFor(agent.id).points }}</b><small>开点</small></span><span><b>{{ metricsFor(agent.id).submitted }}</b><small>提交</small></span><span><b>{{ metricsFor(agent.id).alive }}</b><small>存活</small></span><span><b>{{ metricsFor(agent.id).dead }}</b><small>挂店</small></span><span><b>{{ metricsFor(agent.id).unopened }}</b><small>未开</small></span></div>
                </div>
                <div v-if="!collapsed[agent.id]" class="tree-children">
                  <div v-for="child in children(agent.id)" :key="child.id" class="tree-node" @click="selectedId=child.id">
                    <div class="tree-row" :style="{background:selectedId===child.id?'var(--surface-2)':''}">
                      <span class="tree-toggle">·</span><span class="avatar role-sub_agent">{{ child.name.slice(0,1) }}</span>
                      <div class="tree-meta"><strong>{{ child.name }}</strong><small>层级 {{ child.level }} · {{ child.contact }}</small></div>
                      <div class="tree-stats metrics"><span><b>{{ metricsFor(child.id).points }}</b><small>开点</small></span><span><b>{{ metricsFor(child.id).submitted }}</b><small>提交</small></span><span><b>{{ metricsFor(child.id).alive }}</b><small>存活</small></span><span><b>{{ metricsFor(child.id).dead }}</b><small>挂店</small></span><span><b>{{ metricsFor(child.id).unopened }}</b><small>未开</small></span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
      <aside v-if="selected" class="card card-pad">
        <div class="row between center"><div class="person-cell"><span class="avatar role-top_agent" style="width:44px;height:44px;font-size: calc(15px + var(--font-boost))">{{ selected.name.slice(0,1) }}</span><span><strong style="font-size: calc(14px + var(--font-boost))">{{ selected.name }}</strong><small>{{ selected.agentType==='top'?'顶级代理':'子代理' }} · 层级 {{ selected.level }}</small></span></div><span class="badge success">正常</span></div>
        <div class="detail-list" style="margin-top:20px">
          <div class="detail-item"><label>代理 ID</label><strong>{{ selected.id }}</strong></div>
          <div class="detail-item"><label>上级代理</label><strong>{{ selected.parentId ? visibleAgents.find(a=>a.id===selected.parentId)?.name : '平台直签' }}</strong></div>
          <div class="detail-item"><label>承接公司</label><strong>{{ selected.companyIds.map(id=>visibleCompanies.find(c=>c.id===id)?.name).filter(Boolean).join('、') || '未关联' }}</strong></div>
          <div class="detail-item"><label>联系人</label><strong>{{ selected.contact }}</strong></div>
        </div>
        <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);margin-top:18px">
          <div class="stat-card" style="min-height:90px;padding:12px"><div class="stat-label">开店总点数</div><div class="stat-value" style="font-size: calc(20px + var(--font-boost))">{{ metricsFor(selected.id).points }}</div><div class="stat-foot">本代理及全部下级</div></div>
          <div class="stat-card" style="min-height:90px;padding:12px"><div class="stat-label">有效提交人头</div><div class="stat-value" style="font-size: calc(20px + var(--font-boost))">{{ metricsFor(selected.id).submitted }}</div><div class="stat-foot">待审核 + 已通过，按人头去重</div></div>
          <div class="stat-card" style="min-height:90px;padding:12px"><div class="stat-label">存活店数</div><div class="stat-value" style="font-size: calc(20px + var(--font-boost));color:var(--success)">{{ metricsFor(selected.id).alive }}</div><div class="stat-foot">经营中、暂停、筹备中</div></div>
          <div class="stat-card" style="min-height:90px;padding:12px"><div class="stat-label">挂店 / 死店数</div><div class="stat-value" style="font-size: calc(20px + var(--font-boost));color:var(--danger)">{{ metricsFor(selected.id).dead }}</div><div class="stat-foot">已关店或标记死店</div></div>
          <div class="stat-card" style="min-height:90px;padding:12px"><div class="stat-label">未开店人数</div><div class="stat-value" style="font-size: calc(20px + var(--font-boost));color:var(--warning)">{{ metricsFor(selected.id).unopened }}</div><div class="stat-foot">当前类型下尚未开店的人头</div></div>
        </div>
        <div class="card-head" style="margin:18px 0 10px"><div><h3>按店铺类型分类统计</h3><p>同一统计口径，分别展示不同店铺平台的数据。</p></div></div>
        <div class="table-wrap" style="box-shadow:none;max-height:260px">
          <table class="data-table" style="min-width:620px">
            <thead><tr><th>店铺类型</th><th>开店总点</th><th>提交人头</th><th>存活店</th><th>挂店</th><th>未开店</th></tr></thead>
            <tbody><tr v-for="row in breakdownFor(selected.id)" :key="row.type.id"><td class="primary-cell">{{ row.type.name }}</td><td class="amount">{{ row.metrics.points }}</td><td>{{ row.metrics.submitted }}</td><td class="amount positive">{{ row.metrics.alive }}</td><td class="amount negative">{{ row.metrics.dead }}</td><td>{{ row.metrics.unopened }}</td></tr></tbody>
          </table>
        </div>
        <div class="callout info" style="margin-top:16px"><Icon name="shield" :size="17"/><div><strong>数据范围规则</strong><p>顶级代理可查看完整下级树；子代理只能查看自己和自己的下级，不能看到上级利润。</p></div></div>
        <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap">
          <button class="btn primary" @click="openCreate(selected)"><Icon name="plus" :size="15"/>新增下级</button>
          <button v-if="canManageSelected" class="btn secondary" @click="openEdit(selected)"><Icon name="edit" :size="15"/>编辑资料</button>
          <button v-if="canManageSelected" class="btn danger" @click="remove(selected)"><Icon name="trash" :size="15"/>停用</button>
        </div>
      </aside>
    </section>

    <Modal :open="modalOpen" :title="editingId?'编辑代理':(currentUser?.role==='platform'?'新增顶级代理':'新增自己的子代理')" @close="modalOpen=false">
      <template #subtitle><p>代理树关系决定数据范围和逐级结算路径。</p></template>
      <div class="form-grid">
        <div class="field"><label>代理名称 <b>*</b></label><input v-model="form.name" class="input"/></div>
        <div class="field"><label>联系人</label><input v-model="form.contact" class="input"/></div>
        <div class="field"><label>上级代理</label><select v-model="form.parentId" class="select" :disabled="currentUser?.role==='top_agent'"><option v-if="currentUser?.role==='platform'" :value="null">无（顶级代理）</option><option v-for="agent in visibleAgents.filter(a=>a.id!==form.id)" :key="agent.id" :value="agent.id">{{ agent.name }}</option></select><span v-if="currentUser?.role==='top_agent'" class="hint">只能新增到自己的代理树下，不能创建或查看其他顶级代理。</span></div>
        <div class="field"><label>层级</label><input v-model.number="form.level" class="input" type="number" min="1"/></div>
        <div class="field"><label>代理类型</label><select v-model="form.agentType" class="select" :disabled="currentUser?.role==='top_agent'"><option v-if="currentUser?.role==='platform'" value="top">顶级代理</option><option value="sub">子代理</option></select><span v-if="currentUser?.role==='top_agent'" class="hint">顶级代理端只能创建子代理。</span></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="active">正常</option><option value="pending">待审核</option><option value="disabled">已停用</option></select></div>
        <div class="field full"><label>承接公司</label><div class="row" style="gap:9px;flex-wrap:wrap"><label v-for="company in visibleCompanies" :key="company.id" class="badge no-dot" style="padding:7px 9px"><input v-model="form.companyIds" type="checkbox" :value="company.id" style="margin-right:3px"/>{{ company.name }}</label></div></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存代理</button></template>
    </Modal>
  </div>
</template>
