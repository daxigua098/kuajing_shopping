<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import { currentUser, resetDemoData, setLanguage, setTheme, state } from '@/store'
import type { Language, ThemeId } from '@/types'
import { downloadJson } from '@/utils/export'

const themes:{id:ThemeId;name:string;desc:string;colors:string[]}[]=[
  {id:1,name:'指挥舱',desc:'深色高密度，适合平台管理员与顶级代理监控异常。',colors:['#07141c','#62e0be','#ffb86b']},
  {id:2,name:'海岛工作台',desc:'轻盈亲和，多角色与东南亚业务适配最好。',colors:['#087d73','#16a18f','#f4f8f7']},
  {id:3,name:'瑞士财务网格',desc:'强秩序、高对比，最适合月末核算与对账。',colors:['#111111','#2255ff','#d8ff36']},
  {id:4,name:'代理关系图谱',desc:'强调代理树、团队与收益增长。',colors:['#251b3b','#7047ae','#d7b967']},
]
const languages:{id:Language;name:string;tag:string}[]=[{id:'zh',name:'简体中文',tag:'ZH'},{id:'en',name:'English',tag:'EN'},{id:'ms',name:'Bahasa Melayu',tag:'MS'}]
const storageSize=computed(()=>Math.round(JSON.stringify(state).length/1024))
function applyTheme(id:ThemeId){setTheme(id);document.documentElement.dataset.theme=String(id)}
function applyLanguage(id:Language){setLanguage(id)}
function reset(){if(window.confirm('确定恢复全部演示数据吗？当前浏览器中的新增、编辑和结算操作将丢失。'))resetDemoData()}
</script>
<template>
  <div>
    <section class="grid-2">
      <article class="card card-pad"><div class="card-head"><div><h3>视觉主题</h3><p>四套 UI 方向均已内置，可以随时切换而不影响业务数据。</p></div><Icon name="sparkles" :size="18"/></div><div class="grid-2" style="grid-template-columns:repeat(2,1fr);margin:0"><button v-for="theme in themes" :key="theme.id" class="card card-pad" style="text-align:left" :style="{borderColor:state.theme===theme.id?'var(--primary)':'var(--line)'}" @click="applyTheme(theme.id)"><div class="row" style="gap:6px"><i v-for="color in theme.colors" :key="color" style="width:24px;height:24px;border-radius:8px;display:block" :style="{background:color}"/></div><div class="row between center" style="margin-top:13px"><strong style="font-size:12px">{{theme.name}}</strong><Icon v-if="state.theme===theme.id" name="check" :size="16"/></div><p class="hint" style="margin:6px 0 0">{{theme.desc}}</p></button></div></article>
      <article class="card card-pad"><div class="card-head"><div><h3>语言与时区</h3><p>账号级语言偏好；金额和编号不翻译。</p></div><Icon name="globe" :size="18"/></div><div class="role-grid" style="margin:0"><button v-for="language in languages" :key="language.id" class="role-card" :style="{borderColor:state.language===language.id?'var(--primary)':'var(--line)'}" @click="applyLanguage(language.id)"><span class="avatar role-platform">{{language.tag}}</span><span style="flex:1"><strong>{{language.name}}</strong><small>界面语言 · 账号级偏好</small></span><Icon v-if="state.language===language.id" name="check" :size="16"/></button></div><div class="detail-list" style="margin-top:20px"><div class="detail-item"><label>业务时区</label><strong>Asia/Kuala_Lumpur (UTC+8)</strong></div><div class="detail-item"><label>金额精度</label><strong>DECIMAL(20,4)</strong></div><div class="detail-item"><label>默认币种</label><strong>MYR · 马来西亚林吉特</strong></div><div class="detail-item"><label>结算日</label><strong>每月 10 日核算上月</strong></div></div></article>
    </section>
    <section class="grid-2" style="margin-top:15px">
      <article class="card card-pad"><div class="card-head"><div><h3>当前账号与权限</h3><p>演示环境可在侧边栏切换角色验证数据隔离。</p></div><Icon name="shield" :size="18"/></div><div class="person-cell"><span class="avatar" :class="'role-'+currentUser?.role" style="width:48px;height:48px;font-size:17px">{{currentUser?.initials}}</span><span><strong style="font-size:15px">{{currentUser?.name}}</strong><small>{{currentUser?.roleLabel}} · {{currentUser?.username}}</small></span></div><div class="detail-list" style="margin-top:20px"><div class="detail-item"><label>数据范围</label><strong>{{currentUser?.role==='platform'?'全平台':currentUser?.role==='company'?'本公司':'本代理树'}}</strong></div><div class="detail-item"><label>导出权限</label><strong>允许，敏感字段脱敏</strong></div><div class="detail-item"><label>结算权限</label><strong>{{currentUser?.role==='sub_agent'?'只读本人收入':'允许查看与处理'}}</strong></div><div class="detail-item"><label>登录安全</label><strong>演示模式 · 正式环境启用 MFA/BCrypt</strong></div></div></article>
      <article class="card card-pad"><div class="card-head"><div><h3>演示数据与备份</h3><p>当前数据保存在浏览器 localStorage，可导出 JSON 存档。</p></div><Icon name="history" :size="18"/></div><div class="stats-grid" style="grid-template-columns:repeat(2,1fr);margin:0"><div class="stat-card" style="min-height:95px;padding:13px"><div class="stat-label">数据体积</div><div class="stat-value" style="font-size:20px">{{storageSize}} KB</div><div class="stat-foot">本地演示状态</div></div><div class="stat-card" style="min-height:95px;padding:13px"><div class="stat-label">审计记录</div><div class="stat-value" style="font-size:20px">{{state.auditLogs.length}}</div><div class="stat-foot">关键操作留痕</div></div></div><div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap"><button class="btn secondary" @click="downloadJson('fenflow-backup.json',state)"><Icon name="download" :size="15"/>导出数据备份</button><button class="btn danger" @click="reset"><Icon name="history" :size="15"/>恢复演示数据</button></div><div class="callout warning" style="margin-top:16px"><Icon name="alert" :size="17"/><div><strong>生产环境差异</strong><p>正式版本需接入 Spring Boot、MySQL、Redis、对象存储与 RBAC 接口权限；前端不能作为数据安全的唯一防线。</p></div></div></article>
    </section>
  </div>
</template>
