<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { agentName, can, companyName, currentUser, ownerName, saveTrafficCard, visibleCompanies, visibleShops } from '@/store'
import type { Shop } from '@/types'
import { downloadRows } from '@/utils/export'
import { daysUntilTrafficExpiry, trafficCardStatus, trafficRenewalText, type TrafficCardStatus } from '@/utils/trafficCard'

const search = ref('')
const statusFilter = ref<'all' | TrafficCardStatus>('all')
const companyFilter = ref('all')
const modalOpen = ref(false)
const editingShop = ref<Shop | null>(null)
const form = reactive({ trafficCardNumber: '', trafficCardExpiryDate: '' })
const statusMeta: Record<TrafficCardStatus, { label: string; cls: string }> = {
  unconfigured: { label: '未配置', cls: 'neutral' },
  missing_expiry: { label: '缺少续费日', cls: 'warning' },
  expired: { label: '已到期', cls: 'danger' },
  due_soon: { label: '即将到期', cls: 'warning' },
  active: { label: '正常', cls: 'success' },
}
const filtered = computed(() => visibleShops.value.filter(shop => {
  const keyword = search.value.trim().toLowerCase()
  const status = trafficCardStatus(shop)
  return (!keyword || [shop.name, shop.code, ownerName(shop.ownerId), agentName(shop.agentId), companyName(shop.companyId), shop.trafficCardNumber || ''].some(value => value.toLowerCase().includes(keyword)))
    && (statusFilter.value === 'all' || status === statusFilter.value)
    && (companyFilter.value === 'all' || shop.companyId === companyFilter.value)
}).sort((a, b) => String(a.trafficCardExpiryDate || '9999-12-31').localeCompare(String(b.trafficCardExpiryDate || '9999-12-31'))))
const stats = computed(() => ({
  total: visibleShops.value.length,
  configured: visibleShops.value.filter(shop => shop.trafficCardNumber).length,
  dueSoon: visibleShops.value.filter(shop => trafficCardStatus(shop) === 'due_soon').length,
  expired: visibleShops.value.filter(shop => trafficCardStatus(shop) === 'expired').length,
}))
function openEdit(shop: Shop) {
  editingShop.value = shop
  form.trafficCardNumber = shop.trafficCardNumber || ''
  form.trafficCardExpiryDate = shop.trafficCardExpiryDate || ''
  modalOpen.value = true
}
function submit() {
  if (!editingShop.value) return
  const result = saveTrafficCard(editingShop.value.id, form.trafficCardNumber, form.trafficCardExpiryDate || null)
  if (!result.ok) { window.alert(result.reason); return }
  modalOpen.value = false
}
function dueText(shop: Shop) {
  const days = daysUntilTrafficExpiry(shop.trafficCardExpiryDate)
  if (days === null) return '未设置到期日'
  if (days < 0) return '已逾期 ' + Math.abs(days) + ' 天'
  if (days === 0) return '今天到期'
  return days + ' 天后到期'
}
function exportCards() {
  downloadRows('流量卡管理-' + new Date().toISOString().slice(0, 10), ['公司', '店铺名称', '店铺编号', '人头姓名', '代理', '流量卡号码', '每月续费日', '到期日期', '到期状态'], filtered.value.map(shop => [companyName(shop.companyId), shop.name, shop.code, ownerName(shop.ownerId), agentName(shop.agentId), shop.trafficCardNumber || '', trafficRenewalText(shop.trafficCardExpiryDate), shop.trafficCardExpiryDate || '', statusMeta[trafficCardStatus(shop)].label]), 'csv')
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索店铺、人头、卡号"/></div>
      <select v-model="statusFilter" class="select" style="width:150px"><option value="all">全部卡片状态</option><option value="active">正常</option><option value="due_soon">即将到期</option><option value="expired">已到期</option><option value="missing_expiry">缺少续费日</option><option value="unconfigured">未配置</option></select>
      <select v-if="currentUser?.role==='platform'" v-model="companyFilter" class="select" style="width:170px"><option value="all">全部公司</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportCards"><Icon name="download" :size="15"/>导出流量卡表</button>
    </div>

    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">全部店铺</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ stats.total }}</div><div class="stat-foot">每家店铺对应 1 张流量卡</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已配置卡号</span><span class="stat-icon"><Icon name="card" :size="16"/></span></div><div class="stat-value">{{ stats.configured }}</div><div class="stat-foot">已完成卡号绑定</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">7 天内到期</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value" style="color:var(--warning)">{{ stats.dueSoon }}</div><div class="stat-foot">需要尽快安排充值</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已到期</span><span class="stat-icon" style="background:var(--danger-soft);color:var(--danger)"><Icon name="x" :size="16"/></span></div><div class="stat-value" style="color:var(--danger)">{{ stats.expired }}</div><div class="stat-foot">请立即核对并续费</div></article>
    </section>

    <div class="callout info" style="margin-bottom:15px"><Icon name="card" :size="18"/><div><strong>一店一卡</strong><p>流量卡号与店铺唯一绑定，并记录每月到期续费日。续费完成后请及时更新下一期到期日期。</p></div></div>

    <div class="table-wrap"><table class="data-table"><thead><tr><th>店铺</th><th>人头</th><th>公司 / 代理</th><th>流量卡号码</th><th>每月续费</th><th>到期日期</th><th>状态</th><th>操作</th></tr></thead><tbody>
      <tr v-for="shop in filtered" :key="shop.id">
        <td><div class="primary-cell">{{ shop.name }}</div><div class="secondary-line">{{ shop.code }}</div></td>
        <td>{{ ownerName(shop.ownerId) }}</td>
        <td>{{ companyName(shop.companyId) }}<div class="secondary-line">{{ agentName(shop.agentId) }}</div></td>
        <td><code style="color:var(--primary);font-weight:800">{{ shop.trafficCardNumber || '未配置' }}</code></td>
        <td>{{ trafficRenewalText(shop.trafficCardExpiryDate) }}</td>
        <td>{{ shop.trafficCardExpiryDate || '未设置' }}<div class="secondary-line">{{ dueText(shop) }}</div></td>
        <td><span class="badge" :class="statusMeta[trafficCardStatus(shop)].cls">{{ statusMeta[trafficCardStatus(shop)].label }}</span></td>
        <td><button v-if="can('manageTrafficCards')" class="btn secondary small" @click="openEdit(shop)"><Icon name="edit" :size="13"/>编辑卡片</button></td>
      </tr>
      <tr v-if="!filtered.length"><td colspan="8"><div class="table-empty"><Icon name="card" :size="30"/><div>没有匹配的流量卡</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" title="编辑店铺流量卡" width="620px" @close="modalOpen=false">
      <template #subtitle><p>{{ editingShop?.name }} · {{ editingShop?.code }}</p></template>
      <div class="form-grid">
        <div class="field"><label>流量卡号码</label><input v-model="form.trafficCardNumber" class="input" placeholder="例如：MYTC-8801001"/><span class="hint">每个卡号只能绑定一家店铺。</span></div>
        <div class="field"><label>到期续费日期</label><input v-model="form.trafficCardExpiryDate" class="input" type="date"/><span class="hint">系统按月显示续费日，续费后更新到下一期。</span></div>
      </div>
      <div class="callout warning" style="margin-top:14px"><Icon name="alert" :size="17"/><div><strong>定期充值提醒</strong><p>建议在到期日前完成充值，避免店铺网络中断。</p></div></div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存流量卡</button></template>
    </Modal>
  </div>
</template>