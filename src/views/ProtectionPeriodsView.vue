<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { currentUser, deleteProtectionPeriod, saveProtectionPeriod, state, visibleCompanies, visibleProtectionPeriods } from '@/store'
import type { ProtectionPeriodTemplate } from '@/types'
import { downloadRows } from '@/utils/export'

const search = ref('')
const companyFilter = ref('all')
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<ProtectionPeriodTemplate>({ id:'', companyId:'', name:'', months:1, status:'active', remark:'', createdAt:'', updatedAt:'' })
const filtered = computed(() => visibleProtectionPeriods.value.filter(period => {
  const keyword = search.value.trim().toLowerCase()
  return (!keyword || [period.name, period.remark, String(period.months)].some(value => value.toLowerCase().includes(keyword)))
    && (companyFilter.value === 'all' || period.companyId === companyFilter.value)
}))
const activePeriods = computed(() => visibleProtectionPeriods.value.filter(period => period.status === 'active'))
const usedCount = (id: string) => state.shops.filter(shop => shop.protectionPeriodId === id).length
const companyLabel = (id: string) => visibleCompanies.value.find(company => company.id === id)?.name || id
function openCreate() {
  editingId.value = null
  Object.assign(form, { id:'cpp' + Date.now(), companyId:currentUser.value?.companyId || visibleCompanies.value[0]?.id || '', name:'', months:1, status:'active' as const, remark:'', createdAt:new Date().toISOString().slice(0,10), updatedAt:'' })
  modalOpen.value = true
}
function openEdit(period: ProtectionPeriodTemplate) {
  editingId.value = period.id
  Object.assign(form, JSON.parse(JSON.stringify(period)))
  modalOpen.value = true
}
function submit() {
  if (!form.name.trim() || form.months <= 0) return
  const result = saveProtectionPeriod({ ...form })
  if (!result.ok) { window.alert(result.reason); return }
  modalOpen.value = false
}
function toggleStatus(period: ProtectionPeriodTemplate) {
  saveProtectionPeriod({ ...period, status: period.status === 'active' ? 'disabled' : 'active' })
}
function remove(period: ProtectionPeriodTemplate) {
  const result = deleteProtectionPeriod(period.id)
  if (!result.ok) window.alert(result.reason)
}
function exportPeriods() {
  downloadRows('保护期类型-' + new Date().toISOString().slice(0,10), ['公司','保护期名称','保护月数','使用店铺数','状态','备注'], filtered.value.map(period => [companyLabel(period.companyId), period.name, period.months, usedCount(period.id), period.status === 'active' ? '生效' : '停用', period.remark]), 'csv')
}
</script>
<template>
  <div>
    <div class="callout info" style="margin-bottom:15px"><Icon name="shield" :size="18"/><div><strong>公司独立保护期</strong><p>保护期按公司隔离，可设置 1 个月、3 个月、6 个月或其他月数。店铺开店时选择保护期，系统会保存店铺快照。</p></div></div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索保护期名称或月数"/></div>
      <select v-if="currentUser?.role==='platform'" v-model="companyFilter" class="select" style="width:170px"><option value="all">全部公司</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportPeriods"><Icon name="download" :size="15"/>导出保护期</button>
      <button class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>新增保护期类型</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">保护期类型</span><span class="stat-icon"><Icon name="shield" :size="16"/></span></div><div class="stat-value">{{ visibleProtectionPeriods.length }}</div><div class="stat-foot">当前公司可配置类型</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">生效类型</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ activePeriods.length }}</div><div class="stat-foot">店铺开店时可以选择</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">1 / 3 个月</span><span class="stat-icon"><Icon name="history" :size="16"/></span></div><div class="stat-value">{{ activePeriods.filter(p=>[1,3].includes(p.months)).length }}</div><div class="stat-foot">常用保护期类型</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">6 个月及以上</span><span class="stat-icon"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ activePeriods.filter(p=>p.months>=6).length }}</div><div class="stat-foot">长期保护期类型</div></article>
    </section>
    <div class="table-wrap"><table class="data-table"><thead><tr><th v-if="currentUser?.role==='platform'">公司</th><th>保护期名称</th><th>保护月数</th><th>使用店铺</th><th>状态</th><th>备注</th><th>操作</th></tr></thead><tbody>
      <tr v-for="period in filtered" :key="period.id"><td v-if="currentUser?.role==='platform'">{{ companyLabel(period.companyId) }}</td><td><div class="primary-cell">{{ period.name }}</div><div class="secondary-line">{{ period.id }}</div></td><td class="amount">{{ period.months }} 个月</td><td>{{ usedCount(period.id) }} 家</td><td><span class="badge" :class="period.status==='active'?'success':'neutral'">{{ period.status==='active'?'生效':'停用' }}</span></td><td style="max-width:260px;color:var(--muted)">{{ period.remark || '无' }}</td><td><div class="row-actions"><button class="row-action" title="编辑" @click="openEdit(period)"><Icon name="edit" :size="15"/></button><button class="row-action" :title="period.status==='active'?'停用':'启用'" @click="toggleStatus(period)"><Icon :name="period.status==='active'?'x':'check'" :size="15"/></button><button class="row-action danger" title="删除" @click="remove(period)"><Icon name="trash" :size="15"/></button></div></td></tr>
      <tr v-if="!filtered.length"><td :colspan="currentUser?.role==='platform'?7:6"><div class="table-empty"><Icon name="shield" :size="30"/><div>还没有保护期类型</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" :title="editingId?'编辑保护期类型':'新增保护期类型'" width="620px" @close="modalOpen=false">
      <template #subtitle><p>保护期从店铺开店月份开始计算，店铺会保存当时的月数快照。</p></template>
      <div class="form-grid">
        <div v-if="currentUser?.role==='platform'" class="field full"><label>所属公司</label><select v-model="form.companyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>保护期名称 <b>*</b></label><input v-model="form.name" class="input" placeholder="例如：3个月保护期"/></div>
        <div class="field"><label>保护月数 <b>*</b></label><input v-model.number="form.months" class="input" type="number" min="1"/><span class="hint">例如填写 1、3、6。</span></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="active">生效</option><option value="disabled">停用</option></select></div>
        <div class="field full"><label>备注</label><textarea v-model="form.remark" class="textarea" placeholder="说明适用合同或业务场景"></textarea></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存保护期</button></template>
    </Modal>
  </div>
</template>