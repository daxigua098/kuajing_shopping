<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'
import MediaField from '@/components/MediaField.vue'
import Modal from '@/components/Modal.vue'
import { agentName, can, currentUser, deleteShop, ownerName, saveCompanySettlementConfig, visibleCompanySettlementConfigs, visibleCompanySettlementTemplates, visibleProtectionPeriods, visibleShopTypes, saveShop, shopTypeName, setShopStatus, state, visibleAgents, visibleCompanies, visibleOwners, visibleShops } from '@/store'
import type { Owner, SettlementMode, Shop, ShopStatus } from '@/types'
import { maskAccount, money } from '@/utils/format'
import { downloadRows } from '@/utils/export'
import { statusAfterCloseDateChange } from '@/utils/shop'
import { matchesShopDateRange, type ShopDateFilterMode } from '@/utils/shopDateFilter'
import { createShopExportFields, type ShopExportFieldKey } from '@/utils/shopExport'

const route = useRoute()
const search = ref(String(route.query.q || ''))
watch(() => route.query.q, value => { search.value = String(value || '') })
const statusFilter = ref('all')
const companyFilter = ref('all')
const modeFilter = ref('all')
const dateFieldFilter = ref<ShopDateFilterMode>('all')
const dateFrom = ref('')
const dateTo = ref('')
const modalOpen = ref(false)
const detailOpen = ref(false)
const editingId = ref<string|null>(null)
const selected = ref<Shop|null>(null)
const preview = ref<{label:string;url:string}|null>(null)
const selectedTemplateId = ref('')
const exportOpen = ref(false)
const exportFields = reactive(createShopExportFields())
const form = reactive<Shop>({ id:'',code:'',name:'',region:'',companyId:'',ownerId:'',agentId:'',shopTypeId:'st1',status:'operating',openDate:'',closeDate:null,taskId:null,mode:'monthly',monthlyRent:280,openingFee:0,openProof:'',closeProof:'',trafficCardNumber:'',trafficCardExpiryDate:null,protectionPeriodId:'',protectionPeriodName:'无保护期',protectionPeriodMonths:0,createdAt:'' })
const companyConfigFor=(shopId:string)=>visibleCompanySettlementConfigs.value.find(config=>config.shopId===shopId)
const selectedTemplate=computed(()=>visibleCompanySettlementTemplates.value.find(template=>template.id===selectedTemplateId.value))
const selectedProtectionPeriod=computed(()=>visibleProtectionPeriods.value.find(period=>period.id===form.protectionPeriodId))
const filtered = computed(() => visibleShops.value.filter(shop => {
  const keyword=search.value.trim().toLowerCase()
  const owner=visibleOwners.value.find(item=>item.id===shop.ownerId)
  return (!keyword || [shop.code,shop.name,shop.region,ownerName(shop.ownerId),agentName(shop.agentId),owner?.icNumber||'',owner?.bankAccount||'',shop.trafficCardNumber||''].some(value=>value.toLowerCase().includes(keyword))) && (statusFilter.value==='all'||shop.status===statusFilter.value) && (companyFilter.value==='all'||shop.companyId===companyFilter.value) && (modeFilter.value==='all'||(currentUser.value?.role==='company'?companyConfigFor(shop.id)?.mode===modeFilter.value:shop.mode===modeFilter.value)) && matchesShopDateRange(shop,dateFieldFilter.value,dateFrom.value,dateTo.value)
}))
const statusText:Record<ShopStatus,string>={operating:'经营中',paused:'暂停',closed:'已关店',preparing:'筹备中'}
const typeName=(id:string)=>shopTypeName(id)
const companyLabel=(id:string)=>visibleCompanies.value.find(company=>company.id===id)?.name||'—'
const ownerForShop=(shop:Shop)=>visibleOwners.value.find(owner=>owner.id===shop.ownerId)
function modeLabelFor(shop:Shop){const config=companyConfigFor(shop.id);return currentUser.value?.role==='company'?(config?.mode==='one_time'?'一次性':config?.mode==='monthly'?'按月':'未设置'):(shop.mode==='head_fee'?'砍头':'按月')}
function modeAmountFor(shop:Shop){const config=companyConfigFor(shop.id);return currentUser.value?.role==='company'?config?.amount??0:shop.monthlyRent}
const availableOwners=computed(()=>currentUser.value?.role==='company'?visibleOwners.value.filter(owner=>state.ownerSubmissions.some(submission=>submission.ownerId===owner.id&&submission.companyId===currentUser.value?.companyId&&submission.shopTypeId===form.shopTypeId&&submission.status==='approved')):visibleOwners.value)
const canViewFullSensitive=computed(()=>currentUser.value?.role!=='company')
function mediaItems(shop:Shop,owner?:Owner){return [{label:'开店成功截图',url:shop.openProof||owner?.shopOpenProof||''},{label:'关店/封店截图',url:shop.closeProof||owner?.shopCloseProof||''},{label:'人头身份证正面',url:owner?.idCardFront||''},{label:'人头身份证反面',url:owner?.idCardBack||''},{label:'银行卡正面',url:owner?.bankCardPhoto||''},{label:'银行卡反面',url:owner?.bankCardBack||''}]}
function openCreate(owner?:Owner){ editingId.value=null; const selectedOwner=owner||availableOwners.value[0]; const typeId=String(route.query.shopTypeId||'st1'); Object.assign(form,{id:'s'+Date.now(),code:'MY-NEW-'+String(Date.now()).slice(-4),name:'',region:'吉隆坡',companyId:currentUser.value?.companyId||selectedOwner?.companyId||visibleCompanies.value[0]?.id||'',ownerId:selectedOwner?.id||'',agentId:selectedOwner?.agentId||visibleAgents.value[0]?.id||'',shopTypeId:typeId,status:'operating' as const,openDate:new Date().toISOString().slice(0,10),closeDate:null,taskId:null,mode:'monthly' as SettlementMode,monthlyRent:state.shopTypes.find(type=>type.id===typeId)?.defaultRent||280,openingFee:0,openProof:'',closeProof:'',trafficCardNumber:'',trafficCardExpiryDate:null,protectionPeriodId:'',protectionPeriodName:'无保护期',protectionPeriodMonths:0,createdAt:new Date().toISOString().slice(0,10)}); selectedTemplateId.value=visibleCompanySettlementTemplates.value.find(template=>template.status==='active')?.id||''; modalOpen.value=true }
function openEdit(shop:Shop){ editingId.value=shop.id; const owner=ownerForShop(shop); Object.assign(form,JSON.parse(JSON.stringify(shop)),{openingFee:shop.openingFee||0,openProof:shop.openProof||owner?.shopOpenProof||'',closeProof:shop.closeProof||owner?.shopCloseProof||'',trafficCardNumber:shop.trafficCardNumber||'',trafficCardExpiryDate:shop.trafficCardExpiryDate||null,protectionPeriodId:shop.protectionPeriodId||'',protectionPeriodName:shop.protectionPeriodName||'无保护期',protectionPeriodMonths:shop.protectionPeriodMonths||0}); selectedTemplateId.value=companyConfigFor(shop.id)?.templateId||visibleCompanySettlementTemplates.value.find(template=>template.status==='active')?.id||''; modalOpen.value=true }
function handleCloseDateChange(){ form.status=statusAfterCloseDateChange(form.closeDate) }
function selectProtectionPeriod(){ if(!selectedProtectionPeriod.value){form.protectionPeriodName='无保护期';form.protectionPeriodMonths=0;return};form.protectionPeriodName=selectedProtectionPeriod.value.name;form.protectionPeriodMonths=selectedProtectionPeriod.value.months }
function openDetail(shop:Shop){ selected.value=shop; detailOpen.value=true }
function submit(){ if(!form.code.trim()||!form.ownerId||!form.agentId)return; if(currentUser.value?.role==='company'&&!selectedTemplate.value){window.alert('请选择公司结算模式分类');return}; const result=saveShop({...form}); if(!result.ok){window.alert(result.reason);return}; if(currentUser.value?.role==='company'&&selectedTemplate.value){const old=companyConfigFor(form.id);const template=selectedTemplate.value;const configResult=saveCompanySettlementConfig({id:old?.id||'csc'+Date.now(),companyId:form.companyId,shopId:form.id,templateId:template.id,templateName:template.name,mode:template.mode,amount:template.amount,currency:template.currency,effectiveMonth:form.openDate.slice(0,7),status:template.status==='active'?'active':'disabled',remark:'开店时选择分类：'+template.name,updatedAt:'',updatedBy:''});if(!configResult.ok){window.alert(configResult.reason);return}}; modalOpen.value=false }
function remove(shop:Shop){ if(window.confirm('确定删除店铺「'+shop.code+'」吗？涉及历史结算时正式环境应改为关店，不可物理删除。')) deleteShop(shop.id) }
function selectOwner(){ const owner=visibleOwners.value.find(item=>item.id===form.ownerId); if(owner){form.agentId=owner.agentId;form.companyId=currentUser.value?.companyId||owner.companyId||form.companyId} }
watch(() => [route.query.create, route.query.ownerId, route.query.shopTypeId], () => {
  if (String(route.query.create) !== '1') return
  const owner = visibleOwners.value.find(item => item.id === String(route.query.ownerId || ''))
  if (owner) openCreate(owner)
}, { immediate: true })
function exportShopValue(shop:Shop,key:ShopExportFieldKey):string|number {
  const owner=ownerForShop(shop)
  if(key==='name')return shop.name
  if(key==='owner')return ownerName(shop.ownerId)
  if(key==='agent')return agentName(shop.agentId)
  if(key==='shopType')return typeName(shop.shopTypeId)
  if(key==='openDate')return shop.openDate||'未填写'
  if(key==='settlementMode')return modeLabelFor(shop)
  if(key==='closeDate')return shop.closeDate||'未封店'
  if(key==='shopId')return shop.id
  if(key==='code')return shop.code
  if(key==='company')return companyLabel(shop.companyId)
  if(key==='region')return shop.region
  if(key==='status')return statusText[shop.status]
  if(key==='settlementAmount')return modeAmountFor(shop)
  if(key==='openingFee')return shop.openingFee||0
  if(key==='icNumber')return owner?.icNumber||''
  if(key==='bankAccount')return canViewFullSensitive.value?(owner?.bankAccount||''):maskAccount(owner?.bankAccount||'')
  if(key==='openProof')return shop.openProof||owner?.shopOpenProof||''
  if(key==='closeProof')return shop.closeProof||owner?.shopCloseProof||''
  if(key==='trafficCardNumber')return shop.trafficCardNumber||'未配置'
  if(key==='trafficCardExpiryDate')return shop.trafficCardExpiryDate||'未设置'
  return shop.protectionPeriodMonths ? (shop.protectionPeriodName||shop.protectionPeriodMonths+'个月保护期') : '无保护期'
}
function clearDateFilter(){ dateFieldFilter.value='all'; dateFrom.value=''; dateTo.value='' }
function openExport(){ exportOpen.value=true }
function selectAllExportFields(){ exportFields.forEach(field=>field.selected=true) }
function resetExportFields(){ exportFields.forEach(field=>field.selected=field.default) }
function exportShops(){
  const fields=exportFields.filter(field=>field.selected)
  if(!fields.length){window.alert('请至少选择一个导出字段');return}
  downloadRows('店铺档案-'+new Date().toISOString().slice(0,10),fields.map(field=>field.label),filtered.value.map(shop=>fields.map(field=>exportShopValue(shop,field.key))),'csv')
  exportOpen.value=false
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索店铺编号、名称、人头"/></div>
      <select v-model="companyFilter" class="select" style="width:160px"><option value="all">全部公司</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select>
      <select v-model="statusFilter" class="select" style="width:125px"><option value="all">全部状态</option><option value="operating">经营中</option><option value="paused">暂停</option><option value="closed">已关店</option></select>
      <select v-model="modeFilter" class="select" style="width:130px"><option value="all">全部模式</option><template v-if="currentUser?.role==='company'"><option value="one_time">一次性</option><option value="monthly">按月</option></template><template v-else><option value="monthly">按月</option><option value="head_fee">砍头</option></template></select>
      <select v-model="dateFieldFilter" class="select" style="width:130px"><option value="all">全部日期</option><option value="open">开店日期</option><option value="close">封店日期</option></select>
      <input v-model="dateFrom" class="input" type="date" style="width:145px" title="开始日期"/>
      <span class="hint">至</span>
      <input v-model="dateTo" class="input" type="date" style="width:145px" title="结束日期"/>
      <button v-if="dateFrom || dateTo || dateFieldFilter!=='all'" class="btn ghost small" @click="clearDateFilter">清除时间</button>
      <span class="spacer"/>
      <button class="btn secondary" @click="openExport"><Icon name="download" :size="15"/>导出店铺表</button>
      <button v-if="can('manageShops')" class="btn primary" @click="openCreate()"><Icon name="plus" :size="15"/>新增店铺</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">可管理店铺</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleShops.length }}</div><div class="stat-foot">按角色数据范围过滤</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">当前存活</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ visibleShops.filter(s=>s.status==='operating').length }}</div><div class="stat-foot">经营中的店铺</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">按月模式</span><span class="stat-icon"><Icon name="history" :size="16"/></span></div><div class="stat-value">{{ visibleShops.filter(s=>s.mode==='monthly').length }}</div><div class="stat-foot">每月按存活结算</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">本月店租池</span><span class="stat-icon"><Icon name="money" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(currentUser?.role==='company' ? visibleCompanySettlementConfigs.reduce((sum,c)=>sum+c.amount,0) : visibleShops.filter(s=>s.status!=='closed').reduce((sum,s)=>sum+s.monthlyRent,0)) }}</div><div class="stat-foot">{{ currentUser?.role==='company'?'公司结算配置金额':'仅供参考，以核算批次为准' }}</div></article>
    </section>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>店铺</th><th>公司 / 代理</th><th>人头</th><th>店铺类型</th><th>{{ currentUser?.role==='company'?'公司结算模式':'结算模式' }}</th><th>{{ currentUser?.role==='company'?'结算金额':'月租' }}</th><th>开店日期</th><th>封店日期</th><th>流量卡 / 续费日</th><th>保护期</th><th>状态</th><th style="width:130px">操作</th></tr></thead>
        <tbody><tr v-for="shop in filtered" :key="shop.id">
          <td><div class="primary-cell">{{ shop.code }}</div><div class="secondary-line">{{ shop.name }} · {{ shop.region }}</div></td>
          <td><div>{{ visibleCompanies.find(c=>c.id===shop.companyId)?.name }}</div><div class="secondary-line">{{ agentName(shop.agentId) }}</div></td>
          <td>{{ ownerName(shop.ownerId) }}</td><td>{{ typeName(shop.shopTypeId) }}</td>
          <td><span class="mode-chip" :class="{head:(currentUser?.role==='company') ? companyConfigFor(shop.id)?.mode==='one_time' : shop.mode==='head_fee'}">{{ modeLabelFor(shop) }}</span></td>
          <td class="amount">{{ modeAmountFor(shop)?money(modeAmountFor(shop),companyConfigFor(shop.id)?.currency):'—' }}</td>
          <td>{{ shop.openDate || '未填写' }}</td>
          <td>{{ shop.closeDate || '未封店' }}</td>
          <td>{{ shop.trafficCardNumber || '未配置' }}<div class="secondary-line">{{ shop.trafficCardExpiryDate || '未设置续费日' }}</div></td>
          <td>{{ shop.protectionPeriodMonths ? (shop.protectionPeriodName || shop.protectionPeriodMonths+'个月保护期') : '无保护期' }}<div class="secondary-line">{{ shop.protectionPeriodMonths || 0 }} 个月</div></td>
          <td><span class="badge" :class="shop.status==='operating'?'success':shop.status==='closed'?'neutral':'warning'">{{ statusText[shop.status] }}</span></td>
          <td><div class="row-actions"><button class="row-action" @click="openDetail(shop)"><Icon name="eye" :size="15"/></button><button v-if="can('manageShops')" class="row-action" @click="openEdit(shop)"><Icon name="edit" :size="15"/></button><button v-if="can('manageShops') && shop.status!=='closed'" class="row-action danger" title="关店" @click="setShopStatus(shop.id,'closed')"><Icon name="x" :size="15"/></button><button v-if="can('manageShops') && shop.status==='closed'" class="row-action" title="重新启用" @click="setShopStatus(shop.id,'operating')"><Icon name="check" :size="15"/></button></div></td>
        </tr><tr v-if="!filtered.length"><td colspan="12"><div class="table-empty"><Icon name="store" :size="30"/><div>没有匹配的店铺</div></div></td></tr></tbody>
      </table>
    </div>

    <Modal :open="modalOpen" :title="editingId?'编辑店铺档案':'新增店铺'" width="780px" @close="modalOpen=false">
      <template #subtitle><p>存活判定以开业日和关店日为准，关店后次月停止按月结算。</p></template>
      <div class="form-grid three">
        <div class="field"><label>店铺编号 <b>*</b></label><input v-model="form.code" class="input"/></div>
        <div class="field"><label>店铺名称</label><input v-model="form.name" class="input"/></div>
        <div class="field"><label>地区</label><input v-model="form.region" class="input"/></div>
        <div class="field"><label>公司</label><div v-if="currentUser?.role==='company'" class="readonly-field">{{ companyLabel(form.companyId) }}</div><select v-else v-model="form.companyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>人头 <b>*</b></label><select v-model="form.ownerId" class="select" @change="selectOwner"><option v-for="owner in availableOwners" :key="owner.id" :value="owner.id">{{ owner.name }} · {{ owner.icNumber || '无 IC' }}</option></select><span v-if="currentUser?.role==='company'" class="hint">仅显示已审核通过给本公司、且匹配当前店铺类型的人头。</span></div>
        <div class="field"><label>代理</label><select v-model="form.agentId" class="select"><option v-for="agent in visibleAgents" :key="agent.id" :value="agent.id">{{ agent.name }}</option></select></div>
        <div class="field"><label>店铺类型</label><select v-model="form.shopTypeId" class="select" :disabled="Boolean(route.query.shopTypeId)"><option v-for="type in visibleShopTypes.filter(t=>t.status==='active')" :key="type.id" :value="type.id">{{ type.name }} · {{ type.platformCode }}</option></select></div>
        <template v-if="currentUser?.role!=='company'"><div class="field"><label>代理分配模式</label><select v-model="form.mode" class="select"><option value="monthly">按月结算</option><option value="head_fee">砍头（仅首月）</option></select></div><div class="field"><label>代理分配月租</label><input v-model.number="form.monthlyRent" class="input" type="number" min="0"/></div></template><div v-else class="field full"><label>公司结算模式分类 <b>*</b></label><select v-model="selectedTemplateId" class="select"><option v-for="template in visibleCompanySettlementTemplates.filter(t=>t.status==='active')" :key="template.id" :value="template.id">{{ template.name }} · {{ template.mode==='one_time'?'一次性':'按月' }} {{ money(template.amount,template.currency) }}</option></select><span v-if="selectedTemplate" class="hint">开店后按该分类快照：{{ selectedTemplate.mode==='one_time'?'一次性' :'按月' }} {{ money(selectedTemplate.amount,selectedTemplate.currency) }}。</span></div>
        <div class="field"><label>开业日期</label><input v-model="form.openDate" class="input" type="date"/></div>
        <div v-if="editingId" class="field"><label>关店时间</label><input v-model="form.closeDate" class="input" type="date" @change="handleCloseDateChange"/><span class="hint">选择关店时间后，状态自动改为“已关店”。</span></div>
        <div class="field"><label>状态</label><div v-if="!editingId" class="readonly-field">开新店</div><select v-else v-model="form.status" class="select"><option value="operating">经营中</option><option value="paused">暂停</option><option value="closed">已关店</option><option value="preparing">筹备中</option></select></div><div class="field"><label>开店费</label><input v-model.number="form.openingFee" class="input" type="number" min="0" step="0.01"/><span class="hint">新开店铺时记录的扣费金额。</span></div><div class="field"><label>流量卡号码</label><input v-model="form.trafficCardNumber" class="input" placeholder="例如：MYTC-8801001"/><span class="hint">每家店铺单独绑定 1 张流量卡。</span></div><div class="field"><label>流量卡到期续费日</label><input v-model="form.trafficCardExpiryDate" class="input" type="date"/><span class="hint">记录本月到期日期，便于定期充值。</span></div><div class="field"><label>保护期</label><select v-model="form.protectionPeriodId" class="select" @change="selectProtectionPeriod"><option value="">无保护期</option><option v-for="period in visibleProtectionPeriods.filter(item=>item.status==='active')" :key="period.id" :value="period.id">{{ period.name }}（{{ period.months }} 个月）</option></select><span class="hint">默认无保护期，可选择 1、3、6 个月等类型。</span></div>
      </div>
      <div class="media-grid" style="margin-top:14px">
        <MediaField v-model="form.openProof" label="开店成功截图" upload-only hint="选填；上传新店开店成功的截图。" @preview="preview=$event"/>
        <MediaField v-if="editingId" v-model="form.closeProof" label="关店/封店截图" upload-only hint="选填；上传关店或封店截图。" @preview="preview=$event"/>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存店铺</button></template>
    </Modal>

    <Modal :open="detailOpen" title="店铺完整档案" width="920px" @close="detailOpen=false">
      <div v-if="selected">
        <div class="row between center"><div><div class="badge info no-dot">{{ selected.code }}</div><h2 style="font-size: calc(20px + var(--font-boost));margin:9px 0 4px">{{ selected.name }}</h2><span class="hint">{{ selected.region }} · {{ typeName(selected.shopTypeId) }}</span></div><span class="badge" :class="selected.status==='operating'?'success':'warning'">{{ statusText[selected.status] }}</span></div>
        <div class="detail-list" style="margin-top:20px">
          <div class="detail-item"><label>人头名字</label><strong>{{ ownerForShop(selected)?.name || ownerName(selected.ownerId) }}</strong></div>
          <div class="detail-item"><label>IC 卡号</label><strong>{{ ownerForShop(selected)?.icNumber || '未填写' }}</strong></div>
          <div class="detail-item"><label>银行卡号</label><strong>{{ ownerForShop(selected) ? (canViewFullSensitive ? ownerForShop(selected)?.bankAccount : maskAccount(ownerForShop(selected)?.bankAccount || '')) : '未填写' }}</strong></div>
          <div class="detail-item"><label>开户银行 / 开户人</label><strong>{{ ownerForShop(selected)?.bankName || '未填写' }} · {{ ownerForShop(selected)?.bankHolder || '' }}</strong></div>
          <div class="detail-item"><label>开店日期</label><strong>{{ selected.openDate || '未填写' }}</strong></div>
          <div class="detail-item"><label>封店日期</label><strong>{{ selected.closeDate || '未封店' }}</strong></div>
          <div class="detail-item"><label>公司 / 代理</label><strong>{{ companyLabel(selected.companyId) }} · {{ agentName(selected.agentId) }}</strong></div>
          <div class="detail-item"><label>开店费</label><strong>{{ money(selected.openingFee || 0, companyConfigFor(selected.id)?.currency) }}</strong></div>
          <div class="detail-item"><label>流量卡号码</label><strong>{{ selected.trafficCardNumber || '未配置' }}</strong></div>
          <div class="detail-item"><label>流量卡到期续费日</label><strong>{{ selected.trafficCardExpiryDate || '未设置' }}</strong></div>
          <div class="detail-item"><label>保护期</label><strong>{{ selected.protectionPeriodMonths ? (selected.protectionPeriodName || selected.protectionPeriodMonths+'个月保护期') : '无保护期' }}</strong></div>
          <div class="detail-item"><label>{{ currentUser?.role==='company'?'公司结算模式':'代理分配模式' }}</label><strong>{{ modeLabelFor(selected) }} · {{ modeAmountFor(selected)?money(modeAmountFor(selected),companyConfigFor(selected.id)?.currency):'未设置金额' }}</strong></div>
          <div class="detail-item full"><label>备注说明</label><strong>{{ ownerForShop(selected)?.remark || '暂无备注' }}</strong></div>
        </div>
        <div class="card-head" style="margin:20px 0 12px"><div><h3>开店与关店图片凭证</h3><p>包含开店成功截图、关店截图、人头身份证照和银行卡照；未上传时会明确标记。</p></div></div>
        <div class="media-gallery">
          <template v-for="item in mediaItems(selected, ownerForShop(selected))" :key="item.label">
            <button v-if="item.url" class="media-gallery-item" @click="preview=item"><img :src="item.url" :alt="item.label"/><div class="media-caption">{{ item.label }}</div></button>
            <div v-else class="media-gallery-item empty-item">{{ item.label }}<br/>未上传</div>
          </template>
        </div>
        <div class="callout info" style="margin-top:18px"><Icon name="shield" :size="17"/><div><strong>数据权限</strong><p>顶级代理只能打开自己代理树下的店铺；公司端银行账号保持脱敏。正式环境图片应存放在私有对象存储中。</p></div></div>
      </div>
      <template #footer><button class="btn secondary" @click="detailOpen=false">关闭</button><button v-if="can('manageShops')" class="btn primary" @click="selected ? openEdit(selected) : undefined">编辑店铺</button></template>
    </Modal>

    <Modal :open="exportOpen" title="选择店铺导出字段" width="820px" @close="exportOpen=false">
      <template #subtitle><p>默认导出店铺名称、人头、代理、店铺类型、开店时间、结算模式和封店日期；其他字段勾选后才会导出。</p></template>
      <div class="row between center" style="margin-bottom:12px"><span class="hint">已选择 {{ exportFields.filter(field=>field.selected).length }} 个字段</span><div class="row" style="gap:7px"><button class="btn ghost small" @click="selectAllExportFields">全选</button><button class="btn secondary small" @click="resetExportFields">恢复默认</button></div></div>
      <div class="export-field-grid"><label v-for="field in exportFields" :key="field.key" class="export-field" :class="{ selected: field.selected }"><input v-model="field.selected" type="checkbox"/><span>{{ field.label }}</span><b v-if="field.default">默认</b></label></div>
      <div class="callout info" style="margin-top:14px"><Icon name="shield" :size="17"/><div><strong>敏感字段权限</strong><p>公司端银行卡号仍会自动脱敏；截图字段只导出“已上传/未上传”状态。</p></div></div>
      <template #footer><button class="btn secondary" @click="exportOpen=false">取消</button><button class="btn primary" @click="exportShops"><Icon name="download" :size="15"/>导出已选字段</button></template>
    </Modal>

    <Teleport to="body">
      <div v-if="preview" class="media-lightbox" @click.self="preview=null">
        <div class="media-lightbox-panel">
          <div class="media-lightbox-head"><strong>{{ preview.label }}</strong><button class="icon-btn" @click="preview=null"><Icon name="x"/></button></div>
          <img :src="preview.url" :alt="preview.label"/>
        </div>
      </div>
    </Teleport>
  </div>
</template>
