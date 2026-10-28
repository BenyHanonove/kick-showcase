<template>
  <v-card
    variant="flat"
    class="metric-card pa-3 rounded-xl text-center h-100"
    :class="[
      active ? 'active-card' : '',
      active && activeColor ? `active-${activeColor}` : '',
    ]"
    :style="activeStyle"
    @click="emit('click')"
  >
    <v-icon :icon="icon" :color="iconColor" class="mb-1 text-h5" />
    <div class="text-caption text-medium-emphasis">{{ label }}</div>
    <div :class="['text-h5 font-weight-black mt-1', valueColor ? `text-${valueColor}` : '']">
      {{ value }}
    </div>
    <div v-if="caption" class="text-caption text-medium-emphasis mt-1">
      {{ caption }}
    </div>
    <slot />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    icon: string
    iconColor?: string
    label: string
    value: string | number
    valueColor?: string
    caption?: string
    active?: boolean
    activeColor?: string
  }>(),
  {
    active: false,
  },
)

const emit = defineEmits<{
  (e: 'click'): void
}>()

// Highlight derives from the Vuetify theme, so any theme color name works in light and dark.
const activeStyle = computed(() => {
  if (!props.active || !props.activeColor) return {}
  return {
    borderColor: `rgb(var(--v-theme-${props.activeColor}))`,
    boxShadow: `0 0 12px rgba(var(--v-theme-${props.activeColor}), 0.18)`,
  }
})
</script>

<style scoped>
.metric-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline));
  box-shadow: var(--bo-shadow-card);
  cursor: pointer;
  transition: var(--bo-transition-normal);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--bo-shadow-hover);
}

.active-card {
  border-width: 1px !important;
}
</style>
