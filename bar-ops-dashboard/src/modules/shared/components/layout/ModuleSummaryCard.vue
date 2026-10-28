<template>
  <v-card class="summary-card rounded-xl pa-5" variant="flat">
    <div class="d-flex align-center ga-2 mb-4">
      <v-icon :icon="icon" :color="iconColor" />
      <div class="text-subtitle-1 font-weight-bold" :class="titleClass" :style="titleStyle">
        {{ title }}
      </div>
    </div>
    <slot />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  icon: string
  iconColor?: string
  titleColor?: string
}>()

const isClass = computed(() => {
  return (
    props.titleColor && (props.titleColor.startsWith('text-') || props.titleColor.includes(' '))
  )
})

const titleClass = computed(() => {
  if (isClass.value) return props.titleColor
  return ''
})

const titleStyle = computed(() => {
  if (props.titleColor && !isClass.value) {
    return { color: props.titleColor }
  }
  return {}
})
</script>

<style scoped>
.summary-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
}
</style>
