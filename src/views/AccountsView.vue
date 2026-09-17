<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { currentUser, deleteAccount, saveAccount, saveAgent, setAccountStatus, state, visibleAccounts, visibleAgents, visibleCompanies } from '@/store'
import type { AccountStatus, Agent, Role, UserAccount } from '@/types'

const search=ref('')
const roleFilter=ref<'all'|Role>('all')
const statusFilter=ref<'all'|AccountStatus>('all')
const companyFilter=ref('all')
const modalOpen=ref(false)
const form=reactive({id:'',name:'',username:'',password:'Welcome@123',role:'company' as Role,topAgentId:'',agentId:'',companyId:'',language:'zh' as UserAccount['language'],theme:2 as UserAccount['theme'],status:'active' as AccountStatus})
const selectedCompanyIds=ref<string[]>([])
const editingAccount=computed(()=>state.accounts.find(account=>account.id===form.id)||null)
const isPlatform=computed(()=>currentUser.value?.role==='platform')
const roleOptions=computed(()=>currentUser.value?.role==='platform'?[{value:'company',label:'公司账号'},{value:'top_agent',label:'顶级代理账号'},{value:'sub_agent',label:'子代理账号'}]:[{value:'sub_agent',label:'子代理账号'}])
const topAgents=computed(()=>visibleAgents.value.filter(agent=>agent.agentType==='top'))
const availableAgents=computed(()=>{
  if(currentUser.value?.role==='top_agent')return visibleAgents.value.filter(agent=>agent.id!==currentUser.value?.agentId)
  const root=form.topAgentId&&form.topAgentId!=='__new__'?form.topAgentId:''
  if(!root)return visibleAgents.value.filter(agent=>agent.agentType==='sub')
  const ids=new Set<string>();const queue=[root]
  while(queue.length){const parent=queue.shift()!;const children=state.agents.filter(agent=>agent.parentId===parent).map(agent=>agent.id);children.forEach(id=>{if(!ids.has(id)){ids.add(id);queue.push(id)}})}
  return visibleAgents.value.filter(agent=>ids.has(agent.id))
})
const filtered=computed(()=>visibleAccounts.value.filter(account=>{
  const keyword=search.value.trim().toLowerCase()
  const binding=account.companyId?companyName(account.companyId):account.agentId?agentName(account.agentId):''
  return (!keyword||[account.name,account.username,binding].some(value=>value.toLowerCase().includes(keyword)))
    &&(roleFilter.value==='all'||account.role===roleFilter.value)
    &&(statusFilter.value==='all'||account.status===statusFilter.value)
    &&(companyFilter.value==='all'||account.companyId===companyFilter.value)
}).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)))
const statusMeta:Record<AccountStatus,{label:string;cls:string}>={active:{label:'正常',cls:'success'},disabled:{label:'已停用',cls:'neutral'},locked:{label:'已锁定',cls:'danger'},pending:{label:'待激活',cls:'warning'}}
function companyName(id:string){return visibleCompanies.value.find(item=>item.id===id)?.name||state.companies.find(item=>item.id===id)?.name||id}
function agentName(id:string){return state.agents.find(item=>item.id===id)?.name||id}
function roleLabel(role:Role){return {platform:'平台管理员',company:'公司负责人',top_agent:'顶级代理',sub_agent:'子代理'}[role]}
function hasAccount(role:Role,companyId='',agentId=''){return state.accounts.some(account=>account.role===role&&account.companyId===companyId&&account.agentId===agentId)}
function openEdit(account:UserAccount){form.id=account.id;form.name=account.name;form.username=account.username;form.password=account.password;form.role=account.role;form.topAgentId=account.role==='sub_agent'&&account.agentId?state.agents.find(agent=>agent.id===account.agentId)?.parentId||'':account.agentId||'';form.agentId=account.agentId||'';form.companyId=account.companyId||'';form.language=account.language||state.systemSettings.defaultLanguage;form.theme=account.theme||state.systemSettings.defaultTheme;form.status=account.status==='disabled'?'disabled':'active';const agent=account.agentId?state.agents.find(item=>item.id===account.agentId):null;selectedCompanyIds.value=agent?[...agent.companyIds]:[];modalOpen.value=true}
function openCreate(){form.id='u'+Date.now();form.name='';form.username='';form.password='Welcome@123';form.role=currentUser.value?.role==='platform'?'company':'sub_agent';form.topAgentId=currentUser.value?.agentId||topAgents.value[0]?.id||'';form.agentId=availableAgents.value.find(agent=>!hasAccount('sub_agent','',agent.id))?.id||'';form.companyId=visibleCompanies.value.find(company=>!hasAccount('company',company.id,''))?.id||'';form.language=state.systemSettings.defaultLanguage;form.theme=state.systemSettings.defaultTheme;form.status='active';selectedCompanyIds.value=[];modalOpen.value=true}
function syncRole(){if(form.role==='company'){form.topAgentId='';form.agentId='';if(!visibleCompanies.value.some(company=>company.id===form.companyId))form.companyId=visibleCompanies.value.find(company=>!hasAccount('company',company.id,''))?.id||visibleCompanies.value[0]?.id||'';form.name=companyName(form.companyId);selectedCompanyIds.value=[]}else if(form.role==='top_agent'){form.companyId='';form.agentId='';if(!topAgents.value.some(agent=>agent.id===form.topAgentId)&&form.topAgentId!=='__new__')form.topAgentId=topAgents.value.find(agent=>!hasAccount('top_agent','',agent.id))?.id||'__new__';const agent=state.agents.find(item=>item.id===form.topAgentId);form.name=agent?.name||form.name;selectedCompanyIds.value=agent?[...agent.companyIds]:[]}else{form.companyId='';if(isPlatform.value&&!topAgents.value.some(agent=>agent.id===form.topAgentId))form.topAgentId=topAgents.value[0]?.id||'';if(isPlatform.value&&!availableAgents.value.some(agent=>agent.id===form.agentId))form.agentId=availableAgents.value.find(agent=>!hasAccount('sub_agent','',agent.id))?.id||availableAgents.value[0]?.id||'';form.name=form.agentId?agentName(form.agentId):form.name;selectedCompanyIds.value=[]}}
function submit(){
  let agentId=form.agentId
  if(isPlatform.value&&form.role==='top_agent'){
    if(form.topAgentId==='__new__'){
      const newAgent:Agent={id:'a'+Date.now(),name:form.name.trim(),parentId:null,level:1,agentType:'top',companyIds:selectedCompanyIds.value,contact:form.name.trim(),status:'active',createdAt:new Date().toISOString().slice(0,10)}
      saveAgent(newAgent);agentId=newAgent.id
    }else{
      agentId=form.topAgentId
      const existing=state.agents.find(agent=>agent.id===agentId)
      if(existing)saveAgent({...existing,companyIds:selectedCompanyIds.value})
    }
  }
  if(form.role==='company'&&!form.companyId){window.alert('请选择公司');return}
  if(form.role!=='company'&&!agentId){window.alert('请选择代理');return}
  const bindingName=form.role==='company'?companyName(form.companyId):agentName(agentId)
  if(editingAccount.value){
    const updated:UserAccount={...editingAccount.value,name:form.name.trim()||bindingName,username:form.username.trim(),password:form.password,role:form.role,companyId:form.role==='company'?form.companyId:undefined,agentId:form.role==='company'?undefined:agentId,roleLabel:roleLabel(form.role),initials:(form.name.trim()||bindingName).slice(0,1).toUpperCase(),language:form.language,theme:form.theme,status:form.status,disabledAt:form.status==='disabled'?(editingAccount.value.disabledAt||new Date().toISOString().slice(0,16).replace('T',' ')):null}
    const result=saveAccount(updated);if(!result.ok){window.alert(result.reason);return};modalOpen.value=false;return
  }
  const account:UserAccount={id:form.id,name:form.name.trim()||bindingName,username:form.username.trim(),password:form.password,role:form.role,companyId:form.role==='company'?form.companyId:undefined,agentId:form.role==='company'?undefined:agentId,roleLabel:roleLabel(form.role),initials:(form.name.trim()||bindingName).slice(0,1).toUpperCase(),language:form.language,theme:form.theme,status:'active',mustChangePassword:true,failedLoginCount:0,lockedUntil:null,lastLoginAt:null,createdBy:currentUser.value?.name||'系统',createdAt:new Date().toISOString().slice(0,16).replace('T',' '),updatedAt:''}
  const result=saveAccount(account)
  if(!result.ok){window.alert(result.reason);return}
  modalOpen.value=false
}

function toggleStatus(account:UserAccount){const next:AccountStatus=account.status==='active'?'disabled':'active';const result=setAccountStatus(account.id,next);if(!result.ok)window.alert(result.reason)}
function remove(account:UserAccount){if(!window.confirm('确定删除账号「'+account.name+'」吗？只删除登录凭据，业务关系和历史记录会保留。'))return;const result=deleteAccount(account.id);if(!result.ok)window.alert(result.reason)}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索账号、用户名或绑定对象"/></div>
      <select v-model="roleFilter" class="select" style="width:145px"><option value="all">全部角色</option><option value="company">公司账号</option><option value="top_agent">顶级代理账号</option><option value="sub_agent">子代理账号</option></select>
      <select v-model="statusFilter" class="select" style="width:135px"><option value="all">全部状态</option><option value="active">正常</option><option value="disabled">已停用</option><option value="locked">已锁定</option><option value="pending">待激活</option></select>
      <select v-if="currentUser?.role==='platform'" v-model="companyFilter" class="select" style="width:165px"><option value="all">全部公司</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select>
      <span class="spacer"/>
      <button class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>{{ currentUser?.role==='platform'?'新增账号':'新增子代理账号' }}</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">账号总数</span><span class="stat-icon"><Icon name="users" :size="16"/></span></div><div class="stat-value">{{ visibleAccounts.length }}</div><div class="stat-foot">当前权限范围内的账号</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">正常账号</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ visibleAccounts.filter(a=>a.status==='active').length }}</div><div class="stat-foot">可以正常登录</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已停用</span><span class="stat-icon" style="background:var(--surface-2);color:var(--muted)"><Icon name="x" :size="16"/></span></div><div class="stat-value">{{ visibleAccounts.filter(a=>a.status==='disabled').length }}</div><div class="stat-foot">业务数据完整保留</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待首次改密</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ visibleAccounts.filter(a=>a.mustChangePassword).length }}</div><div class="stat-foot">下次登录必须修改密码</div></article>
    </section>
    <div class="callout info" style="margin-bottom:15px"><Icon name="shield" :size="18"/><div><strong>账号与业务分离</strong><p>停用或删除账号只影响登录，不会删除公司、代理、人头、店铺、任务、结算和历史记录。</p></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>账号</th><th>角色</th><th>绑定对象</th><th>状态</th><th>首次改密</th><th>最后登录</th><th>创建人 / 时间</th><th>操作</th></tr></thead><tbody>
      <tr v-for="account in filtered" :key="account.id">
        <td><div class="person-cell"><span class="avatar" :class="'role-'+account.role">{{account.initials}}</span><span><strong>{{account.name}}</strong><small>{{account.username}}</small></span></div></td>
        <td><span class="badge info no-dot">{{account.roleLabel}}</span></td>
        <td>{{account.companyId?companyName(account.companyId):account.agentId?agentName(account.agentId):'平台'}}</td>
        <td><span class="badge" :class="statusMeta[account.status].cls">{{statusMeta[account.status].label}}</span></td>
        <td>{{account.mustChangePassword?'需要':'否'}}</td><td>{{account.lastLoginAt||'从未登录'}}</td>
        <td>{{account.createdBy}}<div class="secondary-line">{{account.createdAt}}</div></td>
        <td><div class="row-actions"><button class="row-action" title="编辑账号" @click="openEdit(account)"><Icon name="edit" :size="15"/></button><button v-if="account.id!==currentUser?.id" class="row-action" :title="account.status==='active'?'停用账号':'启用账号'" @click="toggleStatus(account)"><Icon :name="account.status==='active'?'x':'check'" :size="15"/></button><button v-if="account.id!==currentUser?.id" class="row-action danger" title="删除账号" @click="remove(account)"><Icon name="trash" :size="15"/></button></div></td>
      </tr>
      <tr v-if="!filtered.length"><td colspan="8"><div class="table-empty"><Icon name="users" :size="30"/><div>没有匹配的账号</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="modalOpen" :title="editingAccount?'编辑账号':(currentUser?.role==='platform'?'新增平台账号':'新增子代理账号')" width="760px" @close="modalOpen=false">
      <template #subtitle><p>新账号首次登录时必须修改密码；业务关系和历史记录不会因账号停用或删除而丢失。</p></template>
      <div class="form-grid">
        <div v-if="currentUser?.role==='platform'" class="field"><label>账号类型</label><select v-model="form.role" class="select" :disabled="!isPlatform" @change="syncRole"><option v-for="option in roleOptions" :key="option.value" :value="option.value">{{option.label}}</option></select></div>
        <div v-if="form.role==='company'" class="field"><label>绑定公司</label><select v-model="form.companyId" class="select" :disabled="!isPlatform" @change="syncRole"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id" :disabled="hasAccount('company',company.id,'')">{{company.name}}{{hasAccount('company',company.id,'')?'（已有账号）':''}}</option></select></div>
        <div v-if="form.role==='top_agent'&&currentUser?.role==='platform'" class="field"><label>绑定顶级代理</label><select v-model="form.topAgentId" class="select" :disabled="!isPlatform" @change="syncRole"><option value="__new__">新建顶级代理并开号</option><option v-for="agent in topAgents" :key="agent.id" :value="agent.id" :disabled="hasAccount('top_agent','',agent.id)">{{agent.name}}{{hasAccount('top_agent','',agent.id)?'（已有账号）':''}}</option></select></div>
        <div v-if="form.role==='sub_agent'&&currentUser?.role==='platform'" class="field"><label>所属顶级代理</label><select v-model="form.topAgentId" class="select" @change="form.agentId='';syncRole"><option v-for="agent in topAgents" :key="agent.id" :value="agent.id">{{agent.name}}</option></select></div>
        <div v-if="form.role==='sub_agent'" class="field"><label>绑定子代理</label><select v-model="form.agentId" class="select" :disabled="!isPlatform" @change="syncRole"><option v-for="agent in availableAgents" :key="agent.id" :value="agent.id" :disabled="hasAccount('sub_agent','',agent.id)">{{agent.name}} · 层级 {{agent.level}}{{hasAccount('sub_agent','',agent.id)?'（已有账号）':''}}</option></select></div>
        <div class="field"><label>账号名称 <b>*</b></label><input v-model="form.name" class="input"/></div>
        <div class="field"><label>登录账号 <b>*</b></label><input v-model="form.username" class="input" autocomplete="off"/></div>
        <div class="field"><label>{{editingAccount?'当前密码':'初始密码'}} <b>*</b></label><input v-model="form.password" class="input" type="text"/><span class="hint">{{editingAccount?'修改并保存后，新密码立即生效。':'首次登录后必须修改。'}}</span></div>
        <div class="field"><label>默认语言</label><select v-model="form.language" class="select"><option value="zh">简体中文</option><option value="en">English</option><option value="ms">Bahasa Melayu</option><option value="th">ไทย</option><option value="vi">Tiếng Việt</option></select></div>
        <div class="field"><label>默认视觉主题</label><select v-model.number="form.theme" class="select"><option :value="1">指挥舱</option><option :value="2">海岛工作台</option><option :value="3">瑞士财务网格</option><option :value="4">代理关系图谱</option></select></div>
        <div v-if="editingAccount" class="field"><label>账号状态</label><select v-model="form.status" class="select"><option value="active">启用</option><option value="disabled">停用</option></select><span class="hint">停用后账号无法登录，业务关系和历史记录保留。</span></div>
        <div v-if="editingAccount" class="field"><label>创建人 / 时间</label><div class="readonly-field">{{editingAccount.createdBy}} · {{editingAccount.createdAt}}</div></div>
        <div class="field full" v-if="form.role==='top_agent'"><label>关联公司（可不选）</label><div class="row" style="gap:9px;flex-wrap:wrap"><label v-for="company in visibleCompanies" :key="company.id" class="badge no-dot" style="padding:7px 9px"><input v-model="selectedCompanyIds" type="checkbox" :value="company.id" style="margin-right:3px"/>{{company.name}}</label></div><span class="hint">不选择时，顶级代理登录后可在“合作公司”自行选择。</span></div>
      </div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>{{editingAccount?'保存账号':'创建账号'}}</button></template>
    </Modal>

  </div>
</template>