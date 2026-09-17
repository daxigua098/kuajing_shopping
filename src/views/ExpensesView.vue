<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import MediaField from '@/components/MediaField.vue'
import Modal from '@/components/Modal.vue'
import { agentName, can, currentUser, deleteExpense, saveExpense, settleExpense, shopName, state, visibleExpenses, visibleShops } from '@/store'
import type { ShopExpense } from '@/types'
import { money } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const statusFilter=ref('all')
const monthFilter=ref('2026-08')
const search=ref('')
const modalOpen=ref(false)
const detailOpen=ref(false)
const editingId=ref<string|null>(null)
const selected=ref<ShopExpense|null>(null)
const preview=ref<{label:string;url:string}|null>(null)
const proofDraft=ref('')
const form=reactive<ShopExpense>({id:'',shopId:'',companyId:'',advanceAgentId:'',expenseDate:'',expenseMonth:'',purpose:'',amount:0,currency:'MYR',attachment:'',status:'pending',remark:''})
const filtered=computed(()=>visibleExpenses.value.filter(item=>{
  const k=search.value.trim().toLowerCase()
  return (!k||[shopName(item.shopId),item.purpose,item.remark].some(v=>v.toLowerCase().includes(k)))&&(statusFilter.value==='all'||item.status===statusFilter.value)&&(!monthFilter.value||item.expenseMonth===monthFilter.value)
}))
const totals=computed(()=>({all:filtered.value.reduce((n,x)=>n+x.amount,0),pending:filtered.value.filter(x=>x.status==='pending').reduce((n,x)=>n+x.amount,0),settled:filtered.value.filter(x=>x.status==='settled').reduce((n,x)=>n+x.amount,0)}))
function openCreate(){editingId.value=null;const shop=visibleShops.value[0];Object.assign(form,{id:'e'+Date.now(),shopId:shop?.id||'',companyId:shop?.companyId||'',advanceAgentId:shop?.agentId||'',expenseDate:new Date().toISOString().slice(0,10),expenseMonth:new Date().toISOString().slice(0,7),purpose:'',amount:0,currency:'MYR',attachment:'',status:'pending' as const,remark:''});modalOpen.value=true}
function openEdit(item:ShopExpense){editingId.value=item.id;Object.assign(form,JSON.parse(JSON.stringify(item)));if(!isImageAttachment(item.attachment))form.attachment='';modalOpen.value=true}
function openDetail(item:ShopExpense){selected.value=item;proofDraft.value=isImageAttachment(item.attachment)?item.attachment:'';detailOpen.value=true}
function isImageAttachment(value:string){return Boolean(value && (/^data:image\//i.test(value) || /^https?:\/\//i.test(value) || value.startsWith('/')))}
function selectShop(){const shop=visibleShops.value.find(s=>s.id===form.shopId);if(shop){form.companyId=shop.companyId;form.advanceAgentId=shop.agentId}}
function submit(){if(!form.shopId||!form.purpose||!form.amount)return;saveExpense({...form,expenseMonth:form.expenseDate.slice(0,7)});modalOpen.value=false}
function saveProof(){if(!selected.value||!proofDraft.value){window.alert('请先上传费用凭证截图');return};saveExpense({...selected.value,attachment:proofDraft.value});detailOpen.value=false}
function remove(item:ShopExpense){if(window.confirm('确定删除这笔杂费吗？已支付数据正式环境应冲正而非物理删除。'))deleteExpense(item.id)}
function exportExpenses(){downloadRows('垫付杂费-'+monthFilter.value,['杂费ID','月份','店铺','公司','垫付代理','用途','金额','币种','凭证','状态','备注'],filtered.value.map(item=>[item.id,item.expenseMonth,shopName(item.shopId),state.companies.find(c=>c.id===item.companyId)?.name || '',agentName(item.advanceAgentId),item.purpose,item.amount,item.currency,isImageAttachment(item.attachment)?'已上传截图':item.attachment?'历史凭证文件':'无凭证',item.status==='pending'?'待确认':item.status==='settled'?'已结清':'已驳回',item.remark]),'csv')}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索店铺、用途、备注"/></div>
      <input v-model="monthFilter" class="input" type="month" style="width:150px"/>
      <select v-model="statusFilter" class="select" style="width:130px"><option value="all">全部状态</option><option value="pending">待确认</option><option value="settled">已结清</option><option value="rejected">已驳回</option></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportExpenses"><Icon name="download" :size="15"/>导出杂费表</button>
      <button v-if="can('manageExpenses')" class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>录入垫付杂费</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">筛选金额合计</span><span class="stat-icon"><Icon name="receipt" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(totals.all) }}</div><div class="stat-foot">{{ filtered.length }} 笔杂费记录</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待公司确认</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(totals.pending) }}</div><div class="stat-foot">{{ filtered.filter(x=>x.status==='pending').length }} 笔会影响批次确认</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已结清报销</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(totals.settled) }}</div><div class="stat-foot">公司已全额报销</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待确认率</span><span class="stat-icon"><Icon name="chart" :size="16"/></span></div><div class="stat-value">{{ Math.round(totals.pending/Math.max(1,totals.all)*100) }}%</div><div class="stat-foot">待确认金额 / 筛选金额</div></article>
    </section>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>店铺 / 用途</th><th>公司</th><th>垫付代理</th><th>发生日期</th><th>金额</th><th>凭证</th><th>状态</th><th style="width:150px">操作</th></tr></thead><tbody>
      <tr v-for="item in filtered" :key="item.id"><td><div class="primary-cell">{{ shopName(item.shopId) }}</div><div class="secondary-line">{{ item.purpose }}</div></td><td>{{ state.companies.find(c=>c.id===item.companyId)?.name }}</td><td>{{ agentName(item.advanceAgentId) }}</td><td>{{ item.expenseDate }}<div class="secondary-line">{{ item.expenseMonth }} 结算月</div></td><td class="amount">{{ money(item.amount,item.currency) }}</td><td><button v-if="isImageAttachment(item.attachment)" class="expense-thumb" @click="preview={label:'费用凭证截图',url:item.attachment}"><img :src="item.attachment" alt="费用凭证截图"/><span>查看截图</span></button><span v-else class="badge info no-dot">{{ item.attachment ? '历史凭证文件' : '无凭证' }}</span></td><td><span class="badge" :class="item.status==='settled'?'success':item.status==='rejected'?'danger':'warning'">{{ item.status==='settled'?'已结清':item.status==='rejected'?'已驳回':'待确认' }}</span></td><td><div class="row-actions"><button class="row-action" title="详情" @click="openDetail(item)"><Icon name="eye" :size="15"/></button><button v-if="item.status==='pending' && can('confirmExpense')" class="row-action" title="确认" @click="settleExpense(item.id,'settled')"><Icon name="check" :size="15"/></button><button v-if="can('manageExpenses')" class="row-action" @click="openEdit(item)"><Icon name="edit" :size="15"/></button><button v-if="can('manageExpenses')" class="row-action danger" @click="remove(item)"><Icon name="trash" :size="15"/></button></div></td></tr>
      <tr v-if="!filtered.length"><td colspan="8"><div class="table-empty"><Icon name="receipt" :size="30"/><div>该月份没有匹配的杂费</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" :title="editingId?'编辑垫付杂费':'录入垫付杂费'" width="760px" @close="modalOpen=false">
      <template #subtitle><p>杂费由顶级代理垫付，次月由公司全额报销，不参与代理逐级分配。</p></template>
      <div class="form-grid">
        <div class="field"><label>关联店铺 <b>*</b></label><select v-model="form.shopId" class="select" @change="selectShop"><option v-for="shop in visibleShops" :key="shop.id" :value="shop.id">{{ shop.code }} · {{ shop.name }}</option></select></div>
        <div class="field"><label>用途 <b>*</b></label><input v-model="form.purpose" class="input" placeholder="例如：店铺认证服务费"/></div>
        <div class="field"><label>发生日期</label><input v-model="form.expenseDate" class="input" type="date"/></div>
        <div class="field"><label>金额</label><input v-model.number="form.amount" class="input" type="number" min="0" step="0.01"/></div>
        <div class="field"><label>币种</label><select v-model="form.currency" class="select"><option>MYR</option><option>SGD</option><option>THB</option><option>VND</option></select></div>
        <div class="field full"><label>费用凭证截图（选填）</label><MediaField v-model="form.attachment" label="费用凭证截图" upload-only hint="选填；如上传凭证，仅支持 PNG、JPG、JPEG 等图片截图。" @preview="preview=$event"/></div>
        <div class="field"><label>垫付代理</label><select v-model="form.advanceAgentId" class="select"><option v-for="agent in state.agents.filter(a=>visibleShops.some(s=>s.agentId===a.id))" :key="agent.id" :value="agent.id">{{ agent.name }}</option></select></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="pending">待确认</option><option value="settled">已结清</option><option value="rejected">已驳回</option></select></div>
        <div class="field full"><label>备注</label><textarea v-model="form.remark" class="textarea" placeholder="补充凭证说明、复核意见等"/></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存杂费</button></template>
    </Modal>

    <Teleport to="body"><div v-if="preview" class="media-lightbox" @click.self="preview=null"><div class="media-lightbox-panel"><div class="media-lightbox-head"><strong>{{ preview.label }}</strong><button class="icon-btn" @click="preview=null"><Icon name="x"/></button></div><img :src="preview.url" :alt="preview.label"/></div></div></Teleport>
    <Modal :open="detailOpen" title="杂费报销详情" width="640px" @close="detailOpen=false"><div v-if="selected">
      <div class="row between center"><div><span class="badge info no-dot">{{ selected.expenseMonth }} 结算月</span><h2 style="font-size: calc(19px + var(--font-boost));margin:9px 0 4px">{{ selected.purpose }}</h2><span class="hint">{{ shopName(selected.shopId) }}</span></div><span class="amount" style="font-size: calc(21px + var(--font-boost))">{{ money(selected.amount,selected.currency) }}</span></div>
      <div class="detail-list" style="margin-top:20px"><div class="detail-item"><label>垫付代理</label><strong>{{ agentName(selected.advanceAgentId) }}</strong></div><div class="detail-item"><label>发生日期</label><strong>{{ selected.expenseDate }}</strong></div><div class="detail-item full"><label>费用凭证截图</label><MediaField v-if="isImageAttachment(selected.attachment) || can('uploadExpenseProof')" :model-value="proofDraft" label="费用凭证截图" :readonly="!can('uploadExpenseProof')" upload-only hint="公司端可以上传或更换凭证截图。" @update:model-value="proofDraft=$event" @preview="preview=$event"/><strong v-else>{{ selected.attachment ? '历史凭证文件（非截图）' : '未上传' }}</strong></div><div class="detail-item"><label>状态</label><strong>{{ selected.status==='pending'?'待确认':selected.status==='settled'?'已结清':'已驳回' }}</strong></div><div class="detail-item full"><label>备注</label><strong>{{ selected.remark||'无' }}</strong></div></div>
      <div class="callout info" style="margin-top:18px"><Icon name="shield" :size="17"/><div><strong>报销规则</strong><p>顶级代理垫付后，公司按公司分组全额报销；系统不对子代理逐级拆分杂费。</p></div></div>
    </div><template #footer><button class="btn secondary" @click="detailOpen=false">关闭</button><button v-if="selected?.status==='pending' && can('confirmExpense')" class="btn danger" @click="settleExpense(selected.id,'rejected');detailOpen=false">驳回</button><button v-if="selected && can('uploadExpenseProof') && proofDraft && proofDraft!==selected.attachment" class="btn secondary" @click="saveProof"><Icon name="check" :size="15"/>保存凭证截图</button><button v-if="selected?.status==='pending' && can('confirmExpense')" class="btn primary" @click="settleExpense(selected.id,'settled');detailOpen=false"><Icon name="check" :size="15"/>确认报销</button></template></Modal>
  </div>
</template>
