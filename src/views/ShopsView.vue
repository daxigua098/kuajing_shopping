<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { agentName, can, currentUser, deleteShop, ownerName, saveCompanySettlementConfig, visibleCompanySettlementConfigs, visibleCompanySettlementTemplates, visibleShopTypes, saveShop, shopTypeName, setShopStatus, state, visibleAgents, visibleCompanies, visibleOwners, visibleShops } from '@/store'
import type { Owner, SettlementMode, Shop, ShopStatus } from '@/types'
import { maskAccount, money } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const route = useRoute()
const search = ref(String(route.query.q || ''))
watch(() => route.query.q, value => { search.value = String(value || '') })
const statusFilter = ref('all')
const companyFilter = ref('all')
const modeFilter = ref('all')
const modalOpen = ref(false)
const detailOpen = ref(false)
const editingId = ref<string|null>(null)
const selected = ref<Shop|null>(null)
const preview = ref<{label:string;url:string}|null>(null)
const selectedTemplateId = ref('')
const form = reactive<Shop>({ id:'',code:'',name:'',region:'',companyId:'',ownerId:'',agentId:'',shopTypeId:'st1',status:'operating',openDate:'',closeDate:null,taskId:null,mode:'monthly',monthlyRent:280,createdAt:'' })
const companyConfigFor=(shopId:string)=>visibleCompanySettlementConfigs.value.find(config=>config.shopId===shopId)
const selectedTemplate=computed(()=>visibleCompanySettlementTemplates.value.find(template=>template.id===selectedTemplateId.value))
const filtered = computed(() => visibleShops.value.filter(shop => {
  const keyword=search.value.trim().toLowerCase()
  const owner=visibleOwners.value.find(item=>item.id===shop.ownerId)
  return (!keyword || [shop.code,shop.name,shop.region,ownerName(shop.ownerId),agentName(shop.agentId),owner?.icNumber||'',owner?.bankAccount||''].some(value=>value.toLowerCase().includes(keyword))) && (statusFilter.value==='all'||shop.status===statusFilter.value) && (companyFilter.value==='all'||shop.companyId===companyFilter.value) && (modeFilter.value==='all'||(currentUser.value?.role==='company'?companyConfigFor(shop.id)?.mode===modeFilter.value:shop.mode===modeFilter.value))
}))
const statusText:Record<ShopStatus,string>={operating:'经营中',paused:'暂停',closed:'已关店',preparing:'筹备中'}
const typeName=(id:string)=>shopTypeName(id)
const companyLabel=(id:string)=>visibleCompanies.value.find(company=>company.id===id)?.name||'—'
const ownerForShop=(shop:Shop)=>visibleOwners.value.find(owner=>owner.id===shop.ownerId)
function modeLabelFor(shop:Shop){const config=companyConfigFor(shop.id);return currentUser.value?.role==='company'?(config?.mode==='one_time'?'一次性':config?.mode==='monthly'?'按月':'未设置'):(shop.mode==='head_fee'?'砍头':'按月')}
function modeAmountFor(shop:Shop){const config=companyConfigFor(shop.id);return currentUser.value?.role==='company'?config?.amount??0:shop.monthlyRent}
const availableOwners=computed(()=>currentUser.value?.role==='company'?visibleOwners.value.filter(owner=>state.ownerSubmissions.some(submission=>submission.ownerId===owner.id&&submission.companyId===currentUser.value?.companyId&&submission.shopTypeId===form.shopTypeId&&submission.status==='approved')):visibleOwners.value)
const canViewFullSensitive=computed(()=>currentUser.value?.role!=='company')
function mediaItems(owner?:Owner){return [{label:'人头身份证正面',url:owner?.idCardFront||''},{label:'人头身份证反面',url:owner?.idCardBack||''},{label:'银行卡正面',url:owner?.bankCardPhoto||''},{label:'银行卡反面',url:owner?.bankCardBack||''},{label:'开店成功截图',url:owner?.shopOpenProof||''},{label:'关店截图',url:owner?.shopCloseProof||''}]}
function openCreate(owner?:Owner){ editingId.value=null; const selectedOwner=owner||availableOwners.value[0]; const typeId=String(route.query.shopTypeId||'st1'); Object.assign(form,{id:'s'+Date.now(),code:'MY-NEW-'+String(Date.now()).slice(-4),name:'',region:'吉隆坡',companyId:currentUser.value?.companyId||selectedOwner?.companyId||visibleCompanies.value[0]?.id||'',ownerId:selectedOwner?.id||'',agentId:selectedOwner?.agentId||visibleAgents.value[0]?.id||'',shopTypeId:typeId,status:'operating' as const,openDate:new Date().toISOString().slice(0,10),closeDate:null,taskId:null,mode:'monthly' as SettlementMode,monthlyRent:state.shopTypes.find(type=>type.id===typeId)?.defaultRent||280,createdAt:new Date().toISOString().slice(0,10)}); selectedTemplateId.value=visibleCompanySettlementTemplates.value.find(template=>template.status==='active')?.id||''; modalOpen.value=true }
function openEdit(shop:Shop){ editingId.value=shop.id; Object.assign(form,JSON.parse(JSON.stringify(shop))); selectedTemplateId.value=companyConfigFor(shop.id)?.templateId||visibleCompanySettlementTemplates.value.find(template=>template.status==='active')?.id||''; modalOpen.value=true }
function openDetail(shop:Shop){ selected.value=shop; detailOpen.value=true }
function submit(){ if(!form.code.trim()||!form.ownerId||!form.agentId)return; if(currentUser.value?.role==='company'&&!selectedTemplate.value){window.alert('请选择公司结算模式分类');return}; const result=saveShop({...form}); if(!result.ok){window.alert(result.reason);return}; if(currentUser.value?.role==='company'&&selectedTemplate.value){const old=companyConfigFor(form.id);const template=selectedTemplate.value;const configResult=saveCompanySettlementConfig({id:old?.id||'csc'+Date.now(),companyId:form.companyId,shopId:form.id,templateId:template.id,templateName:template.name,mode:template.mode,amount:template.amount,currency:template.currency,effectiveMonth:form.openDate.slice(0,7),status:template.status==='active'?'active':'disabled',remark:'开店时选择分类：'+template.name,updatedAt:'',updatedBy:''});if(!configResult.ok){window.alert(configResult.reason);return}}; modalOpen.value=false }
function remove(shop:Shop){ if(window.confirm('确定删除店铺「'+shop.code+'」吗？涉及历史结算时正式环境应改为关店，不可物理删除。')) deleteShop(shop.id) }
function selectOwner(){ const owner=visibleOwners.value.find(item=>item.id===form.ownerId); if(owner){form.agentId=owner.agentId;form.companyId=currentUser.value?.companyId||owner.companyId||form.companyId} }
watch(() => [route.query.create, route.query.ownerId, route.query.shopTypeId], () => {
  if (String(route.query.create) !== '1') return
  const owner = visibleOwners.value.find(item => item.id === String(route.query.ownerId || ''))
  if (owner) openCreate(owner)
}, { immediate: true })
function exportShops(){ downloadRows('店铺档案-'+new Date().toISOString().slice(0,10),['店铺ID','编号','名称','公司','代理','人头','IC卡号','银行卡号','类型','模式','月租','状态','开业日期','关店日期'],filtered.value.map(shop=>[shop.id,shop.code,shop.name,visibleCompanies.value.find(c=>c.id===shop.companyId)?.name || '',agentName(shop.agentId),ownerName(shop.ownerId),ownerForShop(shop)?.icNumber||'',ownerForShop(shop)?.bankAccount||'',typeName(shop.shopTypeId),modeLabelFor(shop),modeAmountFor(shop),statusText[shop.status],shop.openDate,shop.closeDate||'']),'csv') }
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索店铺编号、名称、人头"/></div>
      <select v-model="companyFilter" class="select" style="width:160px"><option value="all">全部公司</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select>
      <select v-model="statusFilter" class="select" style="width:125px"><option value="all">全部状态</option><option value="operating">经营中</option><option value="paused">暂停</option><option value="closed">已关店</option></select>
      <select v-model="modeFilter" class="select" style="width:130px"><option value="all">全部模式</option><template v-if="currentUser?.role==='company'"><option value="one_time">一次性</option><option value="monthly">按月</option></template><template v-else><option value="monthly">按月</option><option value="head_fee">砍头</option></template></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportShops"><Icon name="download" :size="15"/>导出店铺表</button>
      <button v-if="can('manageShops')" class="btn primary" @click="openCreate()"><Icon name="plus" :size="15"/>新增店铺</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">可管理店铺</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleShops.length }}</div><div class="stat-foot">按角色数据范围过滤</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">当前存活</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ visibleShops.filter(s=>s.status==='operating').length }}</div><div class="stat-foot">经营中的店铺</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">按月模式</span><span class="stat-icon"><Icon name="history" :size="16"/></span></div><div class="stat-value">{{ visibleShops.filter(s=>s.mode==='monthly').length }}</div><div class="stat-foot">每月按存活结算</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">本月店租池</span><span class="stat-icon"><Icon name="money" :size="16"/></span></div><div class="stat-value" style="font-size:21px">{{ money(currentUser?.role==='company' ? visibleCompanySettlementConfigs.reduce((sum,c)=>sum+c.amount,0) : visibleShops.filter(s=>s.status!=='closed').reduce((sum,s)=>sum+s.monthlyRent,0)) }}</div><div class="stat-foot">{{ currentUser?.role==='company'?'公司结算配置金额':'仅供参考，以核算批次为准' }}</div></article>
    </section>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>店铺</th><th>公司 / 代理</th><th>人头</th><th>店铺类型</th><th>{{ currentUser?.role==='company'?'公司结算模式':'结算模式' }}</th><th>{{ currentUser?.role==='company'?'结算金额':'月租' }}</th><th>状态</th><th style="width:130px">操作</th></tr></thead>
        <tbody><tr v-for="shop in filtered" :key="shop.id">
          <td><div class="primary-cell">{{ shop.code }}</div><div class="secondary-line">{{ shop.name }} · {{ shop.region }}</div></td>
          <td><div>{{ visibleCompanies.find(c=>c.id===shop.companyId)?.name }}</div><div class="secondary-line">{{ agentName(shop.agentId) }}</div></td>
          <td>{{ ownerName(shop.ownerId) }}</td><td>{{ typeName(shop.shopTypeId) }}</td>
          <td><span class="mode-chip" :class="{head:(currentUser?.role==='company') ? companyConfigFor(shop.id)?.mode==='one_time' : shop.mode==='head_fee'}">{{ modeLabelFor(shop) }}</span></td>
          <td class="amount">{{ modeAmountFor(shop)?money(modeAmountFor(shop),companyConfigFor(shop.id)?.currency):'—' }}</td>
          <td><span class="badge" :class="shop.status==='operating'?'success':shop.status==='closed'?'neutral':'warning'">{{ statusText[shop.status] }}</span></td>
          <td><div class="row-actions"><button class="row-action" @click="openDetail(shop)"><Icon name="eye" :size="15"/></button><button v-if="can('manageShops')" class="row-action" @click="openEdit(shop)"><Icon name="edit" :size="15"/></button><button v-if="can('manageShops') && shop.status!=='closed'" class="row-action danger" title="关店" @click="setShopStatus(shop.id,'closed')"><Icon name="x" :size="15"/></button><button v-if="can('manageShops') && shop.status==='closed'" class="row-action" title="重新启用" @click="setShopStatus(shop.id,'operating')"><Icon name="check" :size="15"/></button></div></td>
        </tr><tr v-if="!filtered.length"><td colspan="8"><div class="table-empty"><Icon name="store" :size="30"/><div>没有匹配的店铺</div></div></td></tr></tbody>
      </table>
    </div>

    <Modal :open="modalOpen" :title="editingId?'编辑店铺档案':'新增店铺'" width="780px" @close="modalOpen=false">
      <template #subtitle><p>存活判定以开业日和关店日为准，关店后次月停止按月结算。</p></template>
      <div class="form-grid three">
        <div class="field"><label>店铺编号 <b>*</b></label><input v-model="form.code" class="input"/></div>
        <div class="field"><label>店铺名称</label><input v-model="form.name" class="input"/></div>
        <div class="field"><label>地区</label><input v-model="form.region" class="input"/></div>
        <div class="field"><label>公司</label><select v-model="form.companyId" class="select" :disabled="currentUser?.role==='company'"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>人头 <b>*</b></label><select v-model="form.ownerId" class="select" @change="selectOwner"><option v-for="owner in availableOwners" :key="owner.id" :value="owner.id">{{ owner.name }} · {{ owner.icNumber || '无 IC' }}</option></select><span v-if="currentUser?.role==='company'" class="hint">仅显示已审核通过给本公司、且匹配当前店铺类型的人头。</span></div>
        <div class="field"><label>代理</label><select v-model="form.agentId" class="select"><option v-for="agent in visibleAgents" :key="agent.id" :value="agent.id">{{ agent.name }}</option></select></div>
        <div class="field"><label>店铺类型</label><select v-model="form.shopTypeId" class="select" :disabled="Boolean(route.query.shopTypeId)"><option v-for="type in visibleShopTypes.filter(t=>t.status==='active')" :key="type.id" :value="type.id">{{ type.name }} · {{ type.platformCode }}</option></select></div>
        <template v-if="currentUser?.role!=='company'"><div class="field"><label>代理分配模式</label><select v-model="form.mode" class="select"><option value="monthly">按月结算</option><option value="head_fee">砍头（仅首月）</option></select></div><div class="field"><label>代理分配月租</label><input v-model.number="form.monthlyRent" class="input" type="number" min="0"/></div></template><div v-else class="field full"><label>公司结算模式分类 <b>*</b></label><select v-model="selectedTemplateId" class="select"><option v-for="template in visibleCompanySettlementTemplates.filter(t=>t.status==='active')" :key="template.id" :value="template.id">{{ template.name }} · {{ template.mode==='one_time'?'一次性':'按月' }} {{ money(template.amount,template.currency) }}</option></select><span v-if="selectedTemplate" class="hint">开店后按该分类快照：{{ selectedTemplate.mode==='one_time'?'一次性' :'按月' }} {{ money(selectedTemplate.amount,selectedTemplate.currency) }}。</span></div>
        <div class="field"><label>开业日期</label><input v-model="form.openDate" class="input" type="date"/></div>
        <div class="field"><label>关店日期</label><input v-model="form.closeDate" class="input" type="date"/></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="operating">经营中</option><option value="paused">暂停</option><option value="closed">已关店</option><option value="preparing">筹备中</option></select></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存店铺</button></template>
    </Modal>

    <Modal :open="detailOpen" title="店铺完整档案" width="920px" @close="detailOpen=false">
      <div v-if="selected">
        <div class="row between center"><div><div class="badge info no-dot">{{ selected.code }}</div><h2 style="font-size:20px;margin:9px 0 4px">{{ selected.name }}</h2><span class="hint">{{ selected.region }} · {{ typeName(selected.shopTypeId) }}</span></div><span class="badge" :class="selected.status==='operating'?'success':'warning'">{{ statusText[selected.status] }}</span></div>
        <div class="detail-list" style="margin-top:20px">
          <div class="detail-item"><label>人头名字</label><strong>{{ ownerForShop(selected)?.name || ownerName(selected.ownerId) }}</strong></div>
          <div class="detail-item"><label>IC 卡号</label><strong>{{ ownerForShop(selected)?.icNumber || '未填写' }}</strong></div>
          <div class="detail-item"><label>银行卡号</label><strong>{{ ownerForShop(selected) ? (canViewFullSensitive ? ownerForShop(selected)?.bankAccount : maskAccount(ownerForShop(selected)?.bankAccount || '')) : '未填写' }}</strong></div>
          <div class="detail-item"><label>开户银行 / 开户人</label><strong>{{ ownerForShop(selected)?.bankName || '未填写' }} · {{ ownerForShop(selected)?.bankHolder || '' }}</strong></div>
          <div class="detail-item"><label>开业日期</label><strong>{{ selected.openDate || '未填写' }}</strong></div>
          <div class="detail-item"><label>关店日期</label><strong>{{ selected.closeDate || '未关店' }}</strong></div>
          <div class="detail-item"><label>公司 / 代理</label><strong>{{ companyLabel(selected.companyId) }} · {{ agentName(selected.agentId) }}</strong></div>
          <div class="detail-item"><label>{{ currentUser?.role==='company'?'公司结算模式':'代理分配模式' }}</label><strong>{{ modeLabelFor(selected) }} · {{ modeAmountFor(selected)?money(modeAmountFor(selected),companyConfigFor(selected.id)?.currency):'未设置金额' }}</strong></div>
          <div class="detail-item full"><label>备注说明</label><strong>{{ ownerForShop(selected)?.remark || '暂无备注' }}</strong></div>
        </div>
        <div class="card-head" style="margin:20px 0 12px"><div><h3>开店与关店图片凭证</h3><p>包含开店成功截图、关店截图、人头身份证照和银行卡照；未上传时会明确标记。</p></div></div>
        <div class="media-gallery">
          <template v-for="item in mediaItems(ownerForShop(selected))" :key="item.label">
            <button v-if="item.url" class="media-gallery-item" @click="preview=item"><img :src="item.url" :alt="item.label"/><div class="media-caption">{{ item.label }}</div></button>
            <div v-else class="media-gallery-item empty-item">{{ item.label }}<br/>未上传</div>
          </template>
        </div>
        <div class="callout info" style="margin-top:18px"><Icon name="shield" :size="17"/><div><strong>数据权限</strong><p>顶级代理只能打开自己代理树下的店铺；公司端银行账号保持脱敏。正式环境图片应存放在私有对象存储中。</p></div></div>
      </div>
      <template #footer><button class="btn secondary" @click="detailOpen=false">关闭</button><button v-if="can('manageShops')" class="btn primary" @click="selected ? openEdit(selected) : undefined">编辑店铺</button></template>
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
