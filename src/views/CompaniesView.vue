<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { agentName, companyName, deleteCompany, saveCompany, state, visibleAgents, visibleCompanies, visibleOwners, visibleShops } from '@/store'
import type { Company } from '@/types'
import { downloadRows } from '@/utils/export'

const search = ref('')
const status = ref('all')
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<Company>({ id: '', name: '', region: '', shopCodeRule: '', status: 'active', contact: '', createdAt: '' })
const filtered = computed(() => visibleCompanies.value.filter(item => {
  const keyword = search.value.toLowerCase()
  return (!keyword || [item.name, item.region, item.contact].some(value => value.toLowerCase().includes(keyword))) && (status.value === 'all' || item.status === status.value)
}))
const companyStats = (id: string) => ({
  agents: visibleAgents.value.filter(agent => agent.companyIds.includes(id)).length,
  owners: visibleOwners.value.filter(owner => owner.companyId === id).length,
  shops: visibleShops.value.filter(shop => shop.companyId === id).length,
  rent: visibleShops.value.filter(shop => shop.companyId === id && shop.status !== 'closed').reduce((sum, shop) => sum + shop.monthlyRent, 0),
})
function openCreate() {
  editingId.value = null
  Object.assign(form, { id: 'c' + Date.now(), name: '', region: '', shopCodeRule: '', status: 'active', contact: '', createdAt: new Date().toISOString().slice(0, 10) })
  modalOpen.value = true
}
function openEdit(company: Company) {
  editingId.value = company.id
  Object.assign(form, JSON.parse(JSON.stringify(company)))
  modalOpen.value = true
}
function submit() {
  if (!form.name.trim()) return
  saveCompany({ ...form })
  modalOpen.value = false
}
function remove(company: Company) {
  if (window.confirm('确定停用并移除「' + company.name + '」吗？财务历史仍保留导出记录。')) deleteCompany(company.id)
}
function exportCompanies() {
  downloadRows('公司档案-' + new Date().toISOString().slice(0,10), ['公司ID','公司名称','区域','编码规则','联系人','状态','代理数','人头数','店铺数'], filtered.value.map(item => [item.id,item.name,item.region,item.shopCodeRule,item.contact,item.status,companyStats(item.id).agents,companyStats(item.id).owners,companyStats(item.id).shops]), 'csv')
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15" /><input v-model="search" class="input" placeholder="搜索公司、区域、联系人" /></div>
      <select v-model="status" class="select" style="width:130px"><option value="all">全部状态</option><option value="active">正常合作</option><option value="pending">待审核</option><option value="disabled">已停用</option></select>
      <span class="spacer" />
      <button class="btn secondary" @click="exportCompanies"><Icon name="download" :size="15" />导出 CSV</button>
      <button class="btn primary" @click="openCreate"><Icon name="plus" :size="15" />新增公司</button>
    </div>

    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">合作公司</span><span class="stat-icon"><Icon name="building" :size="16" /></span></div><div class="stat-value">{{ visibleCompanies.length }}</div><div class="stat-foot">当前可视范围</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">覆盖店铺</span><span class="stat-icon"><Icon name="store" :size="16" /></span></div><div class="stat-value">{{ visibleShops.length }}</div><div class="stat-foot">来自 {{ visibleCompanies.length }} 家公司</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">协作代理</span><span class="stat-icon"><Icon name="network" :size="16" /></span></div><div class="stat-value">{{ visibleAgents.length }}</div><div class="stat-foot">公司代理多对多关系</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">本月店租池</span><span class="stat-icon"><Icon name="money" :size="16" /></span></div><div class="stat-value">{{ visibleShops.filter(s=>s.status!=='closed').reduce((n,s)=>n+s.monthlyRent,0).toLocaleString() }}</div><div class="stat-foot">RM · 存活店铺参考值</div></article>
    </section>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>公司</th><th>业务区域</th><th>编码规则</th><th>协作规模</th><th>本月店租参考</th><th>状态</th><th style="width:100px">操作</th></tr></thead>
        <tbody>
          <tr v-for="company in filtered" :key="company.id">
            <td><div class="person-cell"><span class="avatar role-company">{{ company.name.slice(0,1) }}</span><span><strong>{{ company.name }}</strong><small>{{ company.id.toUpperCase() }} · {{ company.contact }}</small></span></div></td>
            <td>{{ company.region }}</td>
            <td><code style="font-size:9px;color:var(--primary)">{{ company.shopCodeRule }}</code></td>
            <td><div>{{ companyStats(company.id).agents }} 代理 · {{ companyStats(company.id).owners }} 人头</div><div class="secondary-line">{{ companyStats(company.id).shops }} 家店铺</div></td>
            <td class="amount">RM {{ companyStats(company.id).rent.toLocaleString() }}</td>
            <td><span class="badge" :class="company.status==='active'?'success':company.status==='pending'?'warning':'neutral'">{{ company.status==='active'?'正常合作':company.status==='pending'?'待审核':'已停用' }}</span></td>
            <td><div class="row-actions"><button class="row-action" title="编辑" @click="openEdit(company)"><Icon name="edit" :size="15"/></button><button class="row-action danger" title="停用" @click="remove(company)"><Icon name="trash" :size="15"/></button></div></td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="7"><div class="table-empty"><Icon name="building" :size="30"/><div>没有匹配的公司</div></div></td></tr>
        </tbody>
      </table>
    </div>

    <Modal :open="modalOpen" :title="editingId ? '编辑公司' : '新增合作公司'" @close="modalOpen=false">
      <template #subtitle><p>维护公司基础资料与店铺编码规则，停用不删除历史财务数据。</p></template>
      <div class="form-grid">
        <div class="field"><label>公司名称 <b>*</b></label><input v-model="form.name" class="input" placeholder="例如：兰卡威优选" /></div>
        <div class="field"><label>业务区域</label><input v-model="form.region" class="input" placeholder="国家 / 城市" /></div>
        <div class="field"><label>店铺编码规则</label><input v-model="form.shopCodeRule" class="input" placeholder="MY-XXX-0001" /></div>
        <div class="field"><label>联系人</label><input v-model="form.contact" class="input" placeholder="负责人姓名" /></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="active">正常合作</option><option value="pending">待审核</option><option value="disabled">已停用</option></select></div>
        <div class="field"><label>创建日期</label><input v-model="form.createdAt" class="input" type="date" /></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存公司</button></template>
    </Modal>
  </div>
</template>
