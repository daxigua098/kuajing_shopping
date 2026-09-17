<script setup lang="ts">
import { ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(defineProps<{ modelValue?: string; label: string; hint?: string; readonly?: boolean; uploadOnly?: boolean }>(), {
  modelValue: '',
  hint: '',
  readonly: false,
  uploadOnly: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  preview: [value: { label: string; url: string }]
}>()
const urlText = ref(props.modelValue.startsWith('data:') ? '' : props.modelValue)
watch(() => props.modelValue, value => { urlText.value = value.startsWith('data:') ? '' : value })
function updateUrl() { emit('update:modelValue', urlText.value.trim()) }
function clear() { urlText.value = ''; emit('update:modelValue', '') }
function openPreview() { if (props.modelValue) emit('preview', { label: props.label, url: props.modelValue }) }
async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) { window.alert('请选择图片文件'); return }
  if (file.size > 8 * 1024 * 1024) { window.alert('图片不能超过 8MB'); return }
  const dataUrl = await compressImage(file)
  urlText.value = ''
  emit('update:modelValue', dataUrl)
}
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('图片读取失败'))
      image.onload = () => {
        const maxSide = 1400
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('浏览器不支持图片处理'))
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
</script>
<template>
  <div class="media-field">
    <label class="media-label">{{ label }} <span v-if="!readonly">选填</span></label>
    <div class="media-field-layout">
      <button type="button" class="media-thumb" :class="{ empty: !modelValue }" @click="openPreview">
        <img v-if="modelValue" :src="modelValue" :alt="label" />
        <template v-else><Icon name="file" :size="20" /><span>暂无图片</span></template>
      </button>
      <div v-if="!readonly" class="media-controls">
        <input v-if="!uploadOnly" v-model="urlText" class="input" placeholder="粘贴图片 URL，或从本地上传" @change="updateUrl" @keyup.enter="updateUrl" />
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <label class="btn secondary small"><Icon name="plus" :size="13"/>上传图片<input type="file" accept="image/*" hidden @change="upload" /></label>
          <button v-if="modelValue" type="button" class="btn ghost small" @click="clear"><Icon name="trash" :size="13"/>移除</button>
        </div>
        <span class="hint">{{ hint || (uploadOnly ? '仅支持上传图片截图，本地图片会自动压缩后保存。' : '支持图片 URL 或本地图片，本地图片会自动压缩后保存。') }}</span>
      </div>
      <div v-else class="hint">{{ modelValue ? '点击缩略图查看原图' : '未上传' }}</div>
    </div>
  </div>
</template>
