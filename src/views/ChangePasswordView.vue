<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { changeOwnPassword, currentUser, logout, state } from '@/store'

const router=useRouter()
const form=reactive({currentPassword:'',nextPassword:'',confirmPassword:''})
const error=ref('')
function submit(){error.value='';if(!form.currentPassword||!form.nextPassword){error.value='请填写完整密码';return}if(form.nextPassword!==form.confirmPassword){error.value='两次输入的新密码不一致';return}const result=changeOwnPassword(form.currentPassword,form.nextPassword);if(!result.ok){error.value=result.reason;return}router.push({name:'dashboard'})}
function exit(){logout();router.push({name:'login'})}
</script>
<template>
  <main class="login-page" :class="'theme-'+state.theme">
    <section class="login-panel">
      <div class="login-brand"><div class="brand-mark"><img v-if="state.systemSettings.logoUrl" :src="state.systemSettings.logoUrl" alt="Logo"/><span v-else>{{state.systemSettings.systemName.slice(0,1)}}</span></div><div><strong>{{state.systemSettings.systemName}}</strong><small>首次登录安全设置</small></div></div>
      <div class="login-copy"><div class="eyebrow">First login security</div><h1>首次登录需要修改密码。</h1><p>账号 {{currentUser?.username}} 正在使用初始密码，修改完成后才能进入业务系统。</p>
        <form class="login-form" @submit.prevent="submit">
          <div class="field"><label>当前密码</label><input v-model="form.currentPassword" class="input login-input" type="password"/></div>
          <div class="field"><label>新密码</label><input v-model="form.nextPassword" class="input login-input" type="password"/><span class="hint">至少 8 位，必须包含字母和数字。</span></div>
          <div class="field"><label>确认新密码</label><input v-model="form.confirmPassword" class="input login-input" type="password"/></div>
          <div v-if="error" class="callout danger"><Icon name="alert" :size="16"/><div><strong>无法修改</strong><p>{{error}}</p></div></div>
          <button class="btn primary login-submit" type="submit"><Icon name="shield" :size="16"/>保存新密码</button>
        </form>
        <button class="btn ghost" @click="exit" style="margin-top:14px"><Icon name="logout" :size="15"/>退出登录</button>
      </div>
      <footer class="login-footer"><span>© {{new Date().getFullYear()}} {{state.systemSettings.systemName}}</span><span>首次登录安全校验</span></footer>
    </section>
  </main>
</template>