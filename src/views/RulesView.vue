<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { agentName, deleteRule, saveRule, shopTypeName, visibleAgents, visibleCompanies, visibleRules, visibleShopTypes } from '@/store'
import type { DistributionRule, SettlementMode } from '@/types'
import { money } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const search=ref('')
const modalOpen=ref(false)
const editingId=ref<string|null>(null)
const form=reactive<DistributionRule>({id:'',companyId:'',agentId:'',shopTypeId:'c1-st1',amount:280,currency:'MYR',mode:'monthly',effectiveDate:'',expireDate:null,version:1,remark:''})
const filtered=computed(()=>visibleRules.value.filter(rule=>{const k=search.value.trim().toLowerCase();return !k||[agentName(rule.agentId),visibleCompanies.value.find(c=>c.id===rule.companyId)?.name||'',rule.remark].some(v=>v.toLowerCase().includes(k))}))
function openCreate(){editingId.value=null;Object.assign(form,{id:'r'+Date.now(),companyId:visibleCompanies.value[0]?.id||'',agentId:visibleAgents.value[0]?.id||'',shopTypeId:visibleShopTypes.value.find(t=>t.status==='active')?.id||'c1-st1',amount:280,currency:'MYR',mode:'monthly' as SettlementMode,effectiveDate:new Date().toISOString().slice(0,10),expireDate:null,version:Math.max(0,...visibleRules.value.map(r=>r.version))+1,remark:'新规则版本'});modalOpen.value=true}
function openEdit(rule:DistributionRule){editingId.value=rule.id;Object.assign(form,JSON.parse(JSON.stringify(rule)));modalOpen.value=true}
function submit(){if(!form.companyId||!form.agentId)return;saveRule({...form});modalOpen.value=false}
function remove(rule:DistributionRule){if(window.confirm('确定删除该规则吗？已确认结算批次应通过规则快照保留历史，不应直接影响历史核算。'))deleteRule(rule.id)}
function exportRules(){downloadRows('分配规则-'+new Date().toISOString().slice(0,10),['规则ID','公司','代理','店铺类型','金额','币种','模式','生效日','失效日','版本','备注'],filtered.value.map(rule=>[rule.id,visibleCompanies.value.find(c=>c.id===rule.companyId)?.name || '',agentName(rule.agentId),shopTypeName(rule.shopTypeId),rule.amount,rule.currency,rule.mode==='head_fee'?'砍头':'按月',rule.effectiveDate,rule.expireDate||'长期',rule.version,rule.remark]),'csv')}
</script>
<template>
  <div>
    <div class="callout info" style="margin-bottom:15px"><Icon name="shield" :size="18"/><div><strong>规则必须版本化</strong><p>不能直接覆盖历史规则；结算批次会保存规则快照，确保重新核算历史月份时结果可追溯。</p></div></div>
    <div class="page-toolbar"><div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索代理、公司或备注"/></div><span class="spacer"/><button class="btn secondary" @click="exportRules"><Icon name="download" :size="15"/>导出规则</button><button class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>新增规则版本</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>公司 → 代理</th><th>店铺类型</th><th>分配金额</th><th>结算模式</th><th>有效期</th><th>版本</th><th>备注</th><th style="width:90px">操作</th></tr></thead><tbody>
      <tr v-for="rule in filtered" :key="rule.id"><td><div class="primary-cell">{{ visibleCompanies.find(c=>c.id===rule.companyId)?.name }}</div><div class="secondary-line">→ {{ agentName(rule.agentId) }}</div></td><td>{{ shopTypeName(rule.shopTypeId) }}</td><td class="amount">{{ money(rule.amount,rule.currency) }}</td><td><span class="mode-chip" :class="{head:rule.mode==='head_fee'}">{{ rule.mode==='head_fee'?'砍头':'按月' }}</span></td><td>{{ rule.effectiveDate }}<div class="secondary-line">至 {{ rule.expireDate||'长期有效' }}</div></td><td><span class="badge info no-dot">v{{ rule.version }}</span></td><td style="max-width:220px">{{ rule.remark }}</td><td><div class="row-actions"><button class="row-action" @click="openEdit(rule)"><Icon name="edit" :size="15"/></button><button class="row-action danger" @click="remove(rule)"><Icon name="trash" :size="15"/></button></div></td></tr>
      <tr v-if="!filtered.length"><td colspan="8"><div class="table-empty"><Icon name="sliders" :size="30"/><div>没有匹配的分配规则</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" :title="editingId?'编辑分配规则':'新增分配规则版本'" @close="modalOpen=false">
      <template #subtitle><p>新增版本不会修改旧版本，只影响生效日期之后的核算。</p></template>
      <div class="form-grid">
        <div class="field"><label>公司</label><select v-model="form.companyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>代理</label><select v-model="form.agentId" class="select"><option v-for="agent in visibleAgents" :key="agent.id" :value="agent.id">{{ agent.name }}</option></select></div>
        <div class="field"><label>店铺类型</label><select v-model="form.shopTypeId" class="select"><option v-for="type in visibleShopTypes.filter(t=>t.status==='active')" :key="type.id" :value="type.id">{{ type.name }}</option></select></div>
        <div class="field"><label>结算模式</label><select v-model="form.mode" class="select"><option value="monthly">按月</option><option value="head_fee">砍头</option></select></div>
        <div class="field"><label>分配金额</label><input v-model.number="form.amount" class="input" type="number" min="0"/></div>
        <div class="field"><label>币种</label><select v-model="form.currency" class="select"><option>MYR</option><option>SGD</option><option>THB</option><option>VND</option></select></div>
        <div class="field"><label>生效日期</label><input v-model="form.effectiveDate" class="input" type="date"/></div>
        <div class="field"><label>失效日期</label><input v-model="form.expireDate" class="input" type="date"/></div>
        <div class="field"><label>版本号</label><input v-model.number="form.version" class="input" type="number" min="1"/></div>
        <div class="field"><label>备注</label><input v-model="form.remark" class="input"/></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存新版本</button></template>
    </Modal>
  </div>
</template>
