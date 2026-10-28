<template>
  <v-avatar :color="props.color" :size="props.size" class="text-white font-weight-bold">
    {{ initials }}
    <slot />
  </v-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    color?: string
    size?: string | number
  }>(),
  {
    color: 'primary',
    size: 32,
  },
)

const initials = computed(() => {
  if (!props.name) return ''
  const parts = props.name.trim().split(/\s+/)
  const first = parts[0]
  if (!first) return ''
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase()
  }
  const second = parts[1]
  if (!second) {
    return first.slice(0, 2).toUpperCase()
  }
  return (first.charAt(0) + second.charAt(0)).toUpperCase()
})
</script>
