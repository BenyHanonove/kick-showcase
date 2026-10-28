<template>
  <!-- Inlined so the mark inherits currentColor and works in both themes -->
  <span class="app-logo" :style="style" v-html="markup" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Raw SVG keeps a single source of truth in src/assets/brand
import markup from '@assets/brand/kick-logo.svg?raw'

const props = withDefaults(defineProps<{ height?: number | string }>(), { height: 24 })

const style = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  color: inherit;
}

.app-logo :deep(svg) {
  height: 100%;
  width: auto;
  display: block;
}
</style>
