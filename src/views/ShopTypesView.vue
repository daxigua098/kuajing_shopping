<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { currentUser, deleteCompanyShopType, saveCompanyShopType, state, visibleCompanies, visibleShops, visibleShopTypes } from '@/store'
import type { CompanyShopType } from '@/types'

const search = ref('')
const companyFilter = ref('all')
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<CompanyShopType>({ id:'', companyId:'', name:'', platformCode:'', currency:'MYR', status:'active', remark:'', createdAt:'' })
const filtered = computed(() => visibleShopTypes.value.filter(type => {
  const keyword = search.value.trim().toLowerCase()
  return (!keyword || [type.name, type.platformCode, type.remark].some(value => value.toLowerCase().includes(keyword))) && (companyFilter.value === 'all' || type.companyId === companyFilter.value)
}))
const companyName = (id:string) => visibleCompanies.value.find(company => company.id === id)?.name || id
const aliveCount = (id:string) => visibleShops.value.filter(shop => shop.shopTypeId === id && shop.status !== 'closed').length
const deadCount = (id:string) => visibleShops.value.filter(shop => shop.shopTypeId === id && shop.status === 'closed').length
function openCreate(){
  editingId.value=null
  Object.assign(form,{id:'cstype'+Date.now(),companyId:currentUser.value?.companyId||visibleCompanies.value[0]?.id||'',name:'',platformCode:'',currency:'MYR',status:'active' as const,remark:'',createdAt:new Date().toISOString().slice(0,10)})
  modalOpen.value=true
}
function openEdit(type:CompanyShopType){editingId.value=type.id;Object.assign(form,JSON.parse(JSON.stringify(type)));modalOpen.value=true}
function submit(){if(!form.name.trim()||!form.platformCode.trim())return;const result=saveCompanyShopType({...form});if(!result.ok){window.alert(result.reason);return};modalOpen.value=false}
function remove(type:CompanyShopType){const result=deleteCompanyShopType(type.id);if(!result.ok){window.alert(result.reason);return}}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索平台名称或代码"/></div>
      <select v-if="currentUser?.role==='platform'" v-model="companyFilter" class="select" style="width:170px"><option value="all">全部公司</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select>
      <span class="spacer"/>
      <button class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>新增店铺类型</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">运营平台类型</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleShopTypes.length }}</div><div class="stat-foot">当前公司可运营的平台</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">生效类型</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ visibleShopTypes.filter(type=>type.status==='active').length }}</div><div class="stat-foot">新增店铺时可以选择</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">存活店铺</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleShops.filter(shop=>shop.status!=='closed').length }}</div><div class="stat-foot">有存活店铺的类型不能删除</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已关店 / 挂店</span><span class="stat-icon"><Icon name="x" :size="16"/></span></div><div class="stat-value">{{ visibleShops.filter(shop=>shop.status==='closed').length }}</div><div class="stat-foot">仅存在关店记录时可删除类型</div></article>
    </section>
    <div class="table-wrap"><table class="data-table"><thead><tr><th v-if="currentUser?.role==='platform'">公司</th><th>店铺类型</th><th>平台代码</th><th>币种</th><th>存活 / 挂店</th><th>状态</th><th>备注</th><th>操作</th></tr></thead><tbody>
      <tr v-for="type in filtered" :key="type.id"><td v-if="currentUser?.role==='platform'">{{ companyName(type.companyId) }}</td><td><div class="primary-cell">{{ type.name }}</div><div class="secondary-line">{{ type.id }}</div></td><td><span class="badge info no-dot">{{ type.platformCode }}</span></td><td>{{ type.currency }}</td><td><span class="amount positive">{{ aliveCount(type.id) }}</span> / <span class="amount negative">{{ deadCount(type.id) }}</span></td><td><span class="badge" :class="type.status==='active'?'success':'neutral'">{{ type.status==='active'?'生效':'停用' }}</span></td><td style="max-width:220px;color:var(--muted)">{{ type.remark || '无' }}</td><td><div class="row-actions"><button class="row-action" title="编辑" @click="openEdit(type)"><Icon name="edit" :size="15"/></button><button class="row-action danger" :disabled="aliveCount(type.id)>0" :title="aliveCount(type.id)>0?'该类型下有存活店铺，不能删除':'删除'" @click="remove(type)"><Icon name="trash" :size="15"/></button></div></td></tr>
      <tr v-if="!filtered.length"><td :colspan="currentUser?.role==='platform'?8:7"><div class="table-empty"><Icon name="store" :size="30"/><div>还没有店铺类型，请先新增运营平台</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" :title="editingId?'编辑店铺类型':'新增店铺类型'" width="620px" @close="modalOpen=false">
      <template #subtitle><p>例如 TK、Shopee、Amazon。新增店铺时只能选择当前公司生效的类型。</p></template>
      <div class="form-grid">
        <div v-if="currentUser?.role==='platform'" class="field full"><label>所属公司</label><select v-model="form.companyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>平台名称 <b>*</b></label><input v-model="form.name" class="input" placeholder="例如：TikTok Shop"/></div>
        <div class="field"><label>平台代码 <b>*</b></label><input v-model="form.platformCode" class="input" placeholder="例如：TK"/></div>
        <div class="field"><label>币种</label><select v-model="form.currency" class="select"><option>MYR</option><option>SGD</option><option>THB</option><option>VND</option></select></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="active">生效</option><option value="disabled">停用</option></select></div>
        <div class="field full"><label>备注</label><textarea v-model="form.remark" class="textarea" placeholder="记录该平台运营说明"></textarea></div>
      </div>
      <div class="callout warning" style="margin-top:14px"><Icon name="alert" :size="17"/><div><strong>删除限制</strong><p>如果该店铺类型下还有存活店铺，系统会阻止删除。只有仅剩已关店/挂店记录时，才允许删除类型。</p></div></div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存店铺类型</button></template>
    </Modal>
  </div>
</template>
