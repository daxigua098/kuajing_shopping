<script setup lang="ts">
import { state } from '@/store'
</script>

<template>
  <div v-i18n class="i18n-root">
    <router-view :key="state.language" />
  </div>
</template>
