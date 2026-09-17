<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { can, claimTask, companyName, currentUser, saveTask, state, updateTaskProgress, visibleCompanies, visibleShopTypes, visibleTaskList } from '@/store'
import type { OpenTask } from '@/types'
import { money } from '@/utils/format'

const statusFilter = ref('all')
const modalOpen = ref(false)
const progressOpen = ref(false)
const editingId = ref<string|null>(null)
const progressTask = ref<OpenTask|null>(null)
const progressValue = ref(0)
const form = reactive<OpenTask>({id:'',title:'',companyId:'',shopTypeId:'c1-st1',quantity:10,region:'',reward:320,mode:'monthly',deadline:'',status:'open',claimedBy:null,completed:0,createdAt:''})
const tasks = computed(() => visibleTaskList.value.filter(task => statusFilter.value==='all'||task.status===statusFilter.value))
const statusText = { open:'待承接', claimed:'进行中', completed:'已完成' } as const
function openCreate(){ editingId.value=null; Object.assign(form,{id:'t'+Date.now(),title:'',companyId:visibleCompanies.value[0]?.id||'',shopTypeId:'st1',quantity:10,region:'马来西亚',reward:320,mode:'monthly' as const,deadline:new Date(Date.now()+30*86400000).toISOString().slice(0,10),status:'open' as const,claimedBy:null,completed:0,createdAt:new Date().toISOString().slice(0,10)}); modalOpen.value=true }
function openEdit(task:OpenTask){ editingId.value=task.id; Object.assign(form,JSON.parse(JSON.stringify(task))); modalOpen.value=true }
function submit(){ if(!form.title.trim())return; saveTask({...form}); modalOpen.value=false }
function openProgress(task:OpenTask){ progressTask.value=task; progressValue.value=task.completed; progressOpen.value=true }
function submitProgress(){ if(progressTask.value) { updateTaskProgress(progressTask.value.id,progressValue.value); progressOpen.value=false } }
function isMine(task:OpenTask){ return task.claimedBy===currentUser.value?.agentId }
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="segmented"><button v-for="item in [{v:'all',t:'全部任务'},{v:'open',t:'待承接'},{v:'claimed',t:'进行中'},{v:'completed',t:'已完成'}]" :key="item.v" :class="{active:statusFilter===item.v}" @click="statusFilter=item.v">{{ item.t }}</button></div>
      <span class="spacer"/>
      <button v-if="can('publishTask')" class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>发布开店任务</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">进行中任务</span><span class="stat-icon"><Icon name="briefcase" :size="16"/></span></div><div class="stat-value">{{ visibleTaskList.filter(t=>t.status==='claimed').length }}</div><div class="stat-foot">代理已承接</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">目标店铺量</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleTaskList.reduce((n,t)=>n+t.quantity,0) }}</div><div class="stat-foot">所有可视任务合计</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已完成开店</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ visibleTaskList.reduce((n,t)=>n+t.completed,0) }}</div><div class="stat-foot">完成率 {{ Math.round(visibleTaskList.reduce((n,t)=>n+t.completed,0)/Math.max(1,visibleTaskList.reduce((n,t)=>n+t.quantity,0))*100) }}%</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待承接</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ visibleTaskList.filter(t=>t.status==='open').length }}</div><div class="stat-foot">顶级代理可以承接</div></article>
    </section>
    <div class="grid-3">
      <article v-for="task in tasks" :key="task.id" class="card card-pad" style="display:flex;flex-direction:column;gap:14px">
        <div class="row between center"><span class="badge" :class="task.status==='completed'?'success':task.status==='claimed'?'info':'warning'">{{ statusText[task.status] }}</span><span class="hint">{{ task.createdAt }}</span></div>
        <div><h3 style="font-size: calc(14px + var(--font-boost));margin:0 0 6px">{{ task.title }}</h3><p class="hint" style="margin:0">{{ companyName(task.companyId) }} · {{ task.region }}</p></div>
        <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);margin:0;gap:8px">
          <div class="stat-card" style="min-height:80px;padding:11px;box-shadow:none"><div class="stat-label">目标数量</div><div class="stat-value" style="font-size: calc(20px + var(--font-boost))">{{ task.quantity }}</div></div>
          <div class="stat-card" style="min-height:80px;padding:11px;box-shadow:none"><div class="stat-label">单店奖励</div><div class="stat-value" style="font-size: calc(18px + var(--font-boost))">{{ money(task.reward) }}</div></div>
        </div>
        <div><div class="row between hint"><span>开店进度</span><b>{{ task.completed }} / {{ task.quantity }}</b></div><div class="progress-track" style="margin-top:7px"><i :style="{width:task.completed/task.quantity*100+'%'}"/></div></div>
        <div class="row between center" style="margin-top:auto"><span class="hint">截止 {{ task.deadline }}</span><div class="row" style="gap:6px"><button v-if="can('publishTask')" class="btn secondary small" @click="openEdit(task)"><Icon name="edit" :size="13"/>编辑</button><button v-if="task.status==='open' && currentUser?.role!=='company' && currentUser?.role!=='platform'" class="btn primary small" @click="claimTask(task.id)">承接任务</button><button v-if="isMine(task)" class="btn primary small" @click="openProgress(task)">更新进度</button></div></div>
      </article>
      <div v-if="!tasks.length" class="card card-pad" style="grid-column:1/-1"><div class="empty-state"><Icon name="briefcase" :size="30"/><h3>没有匹配任务</h3><p>调整筛选条件或发布新的开店任务。</p></div></div>
    </div>

    <Modal :open="modalOpen" :title="editingId?'编辑开店任务':'发布开店任务'" @close="modalOpen=false">
      <template #subtitle><p>任务承接后进入代理体系，开店结果与店铺档案关联。</p></template>
      <div class="form-grid">
        <div class="field full"><label>任务名称 <b>*</b></label><input v-model="form.title" class="input"/></div>
        <div class="field"><label>发布公司</label><select v-model="form.companyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>店铺类型</label><select v-model="form.shopTypeId" class="select"><option v-for="type in visibleShopTypes.filter(t=>t.status==='active')" :key="type.id" :value="type.id">{{ type.name }}</option></select></div>
        <div class="field"><label>目标数量</label><input v-model.number="form.quantity" class="input" type="number" min="1"/></div>
        <div class="field"><label>覆盖区域</label><input v-model="form.region" class="input"/></div>
        <div class="field"><label>单店奖励</label><input v-model.number="form.reward" class="input" type="number" min="0"/></div>
        <div class="field"><label>结算模式</label><select v-model="form.mode" class="select"><option value="monthly">按月</option><option value="head_fee">砍头</option></select></div>
        <div class="field"><label>截止日期</label><input v-model="form.deadline" class="input" type="date"/></div>
        <div class="field"><label>状态</label><select v-model="form.status" class="select"><option value="open">待承接</option><option value="claimed">进行中</option><option value="completed">已完成</option></select></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存任务</button></template>
    </Modal>

    <Modal :open="progressOpen" title="更新开店进度" @close="progressOpen=false">
      <template #subtitle><p>{{ progressTask?.title }}</p></template>
      <div class="field"><label>已完成开店数量</label><input v-model.number="progressValue" class="input" type="number" min="0" :max="progressTask?.quantity"/><span class="hint">达到目标数量后任务自动标记完成。</span></div>
      <template #footer><button class="btn secondary" @click="progressOpen=false">取消</button><button class="btn primary" @click="submitProgress"><Icon name="check" :size="15"/>保存进度</button></template>
    </Modal>
  </div>
</template>
