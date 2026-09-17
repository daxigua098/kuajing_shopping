<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { currentUser, saveCompanySettlementTemplate, state, visibleCompanySettlementConfigs, visibleCompanySettlementTemplates } from '@/store'
import type { CompanySettlementMode, CompanySettlementTemplate } from '@/types'
import { money } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const search = ref('')
const modeFilter = ref<'all' | CompanySettlementMode>('all')
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<CompanySettlementTemplate>({ id:'', companyId:'', name:'', mode:'monthly', amount:0, currency:'MYR', status:'active', remark:'', createdAt:'', updatedAt:'', createdBy:'' })
const filtered = computed(() => visibleCompanySettlementTemplates.value.filter(template => {
  const keyword = search.value.trim().toLowerCase()
  return (!keyword || [template.name, template.remark].some(value => value.toLowerCase().includes(keyword))) && (modeFilter.value === 'all' || template.mode === modeFilter.value)
}))
const activeOneTime = computed(() => visibleCompanySettlementTemplates.value.filter(item => item.status === 'active' && item.mode === 'one_time'))
const activeMonthly = computed(() => visibleCompanySettlementTemplates.value.filter(item => item.status === 'active' && item.mode === 'monthly'))
function usedCount(templateId:string){return visibleCompanySettlementConfigs.value.filter(config=>config.templateId===templateId).length}
function openCreate(){
  editingId.value=null
  Object.assign(form,{id:'cst'+Date.now(),companyId:currentUser.value?.companyId||'',name:'',mode:'monthly' as CompanySettlementMode,amount:0,currency:'MYR',status:'active' as const,remark:'',createdAt:new Date().toISOString().slice(0,10),updatedAt:'',createdBy:currentUser.value?.name||''})
  modalOpen.value=true
}
function openEdit(template:CompanySettlementTemplate){
  editingId.value=template.id
  Object.assign(form,JSON.parse(JSON.stringify(template)))
  modalOpen.value=true
}
function submit(){
  if(!form.name.trim()||form.amount<=0)return
  form.companyId=currentUser.value?.companyId||form.companyId
  const result=saveCompanySettlementTemplate({...form})
  if(!result.ok){window.alert(result.reason);return}
  modalOpen.value=false
}
function toggleStatus(template:CompanySettlementTemplate){
  saveCompanySettlementTemplate({...template,status:template.status==='active'?'disabled':'active'})
}
function exportTemplates(){
  downloadRows('公司结算模式分类-'+new Date().toISOString().slice(0,10),['分类名称','结算类型','金额','币种','使用店铺数','状态','备注'],filtered.value.map(item=>[item.name,item.mode==='one_time'?'一次性':'按月',item.amount,item.currency,usedCount(item.id),item.status==='active'?'生效':'停用',item.remark]),'csv')
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索结算模式分类"/></div>
      <select v-model="modeFilter" class="select" style="width:145px"><option value="all">全部结算类型</option><option value="one_time">一次性</option><option value="monthly">按月</option></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportTemplates"><Icon name="download" :size="15"/>导出分类</button>
      <button class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>新增结算模式分类</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">一次性分类</span><span class="stat-icon"><Icon name="money" :size="16"/></span></div><div class="stat-value">{{ activeOneTime.length }}</div><div class="stat-foot">公司可在一性开店时选择</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">按月分类</span><span class="stat-icon"><Icon name="history" :size="16"/></span></div><div class="stat-value">{{ activeMonthly.length }}</div><div class="stat-foot">公司月度核算使用</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">全部分类</span><span class="stat-icon"><Icon name="sliders" :size="16"/></span></div><div class="stat-value">{{ visibleCompanySettlementTemplates.length }}</div><div class="stat-foot">仅当前公司可见</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已使用店铺</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleCompanySettlementConfigs.length }}</div><div class="stat-foot">开店时已选择分类的店铺</div></article>
    </section>
    <div class="callout info" style="margin-bottom:15px"><Icon name="shield" :size="18"/><div><strong>当前公司独立配置</strong><p>这些分类只对当前公司生效。不同公司分别设置不同的一次性/按月金额，公司核算不会读取其他公司或顶级代理分配规则。</p></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>结算模式分类</th><th>结算类型</th><th>金额</th><th>使用店铺</th><th>状态</th><th>备注</th><th>操作</th></tr></thead><tbody>
      <tr v-for="template in filtered" :key="template.id"><td><div class="primary-cell">{{ template.name }}</div><div class="secondary-line">更新于 {{ template.updatedAt || template.createdAt }}</div></td><td><span class="mode-chip" :class="{head:template.mode==='one_time'}">{{ template.mode==='one_time'?'一次性':'按月' }}</span></td><td class="amount">{{ money(template.amount,template.currency) }}<div class="secondary-line">{{ template.mode==='one_time'?'一次性给与':'每月给与' }}</div></td><td>{{ usedCount(template.id) }} 家</td><td><span class="badge" :class="template.status==='active'?'success':'neutral'">{{ template.status==='active'?'生效':'停用' }}</span></td><td style="max-width:260px;color:var(--muted)">{{ template.remark || '无' }}</td><td><div class="row-actions"><button class="row-action" title="编辑" @click="openEdit(template)"><Icon name="edit" :size="15"/></button><button class="row-action" :title="template.status==='active'?'停用':'启用'" @click="toggleStatus(template)"><Icon :name="template.status==='active'?'x':'check'" :size="15"/></button></div></td></tr>
      <tr v-if="!filtered.length"><td colspan="7"><div class="table-empty"><Icon name="sliders" :size="30"/><div>还没有结算模式分类，请先新增</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" :title="editingId?'编辑结算模式分类':'新增结算模式分类'" width="680px" @close="modalOpen=false">
      <template #subtitle><p>分类创建后，公司在审核通过并开店时选择使用；店铺会保存当时的金额快照。</p></template>
      <div class="form-grid">
        <div class="field full"><label>分类名称 <b>*</b></label><input v-model="form.name" class="input" placeholder="例如：Lazada 一次性标准"/></div>
        <div class="field full"><label>结算类型 <b>*</b></label><div class="segmented" style="width:100%"><button style="flex:1" :class="{active:form.mode==='one_time'}" @click="form.mode='one_time'">一次性结算</button><button style="flex:1" :class="{active:form.mode==='monthly'}" @click="form.mode='monthly'">按月结算</button></div></div>
        <div class="field"><label>{{ form.mode==='one_time'?'一次性给与金额':'每月给与金额' }} <b>*</b></label><input v-model.number="form.amount" class="input" type="number" min="0" step="0.01"/></div>
        <div class="field"><label>币种</label><select v-model="form.currency" class="select"><option>MYR</option><option>SGD</option><option>THB</option><option>VND</option></select></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="active">生效</option><option value="disabled">停用</option></select></div>
        <div class="field full"><label>备注</label><textarea v-model="form.remark" class="textarea" placeholder="记录合同批次、适用平台或金额说明"></textarea></div>
      </div>
      <div class="callout info" style="margin-top:14px"><Icon name="shield" :size="17"/><div><strong>公司独立</strong><p>此分类只属于当前公司；其他公司可以创建同名分类但金额和配置互不影响。</p></div></div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存分类</button></template>
    </Modal>
  </div>
</template>
