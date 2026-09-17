<script setup lang="ts">
import Icon from './Icon.vue'
defineProps<{ open: boolean; title: string; width?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <section class="modal-card" :style="{ maxWidth: width || '720px' }">
          <header class="modal-head">
            <div><h3>{{ title }}</h3><slot name="subtitle" /></div>
            <button class="icon-btn" @click="emit('close')"><Icon name="x" /></button>
          </header>
          <div class="modal-body"><slot /></div>
          <footer v-if="$slots.footer" class="modal-foot"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
