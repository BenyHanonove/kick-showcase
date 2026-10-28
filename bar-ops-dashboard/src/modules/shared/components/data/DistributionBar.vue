<template>
  <div
    class="distribution-bar rounded-lg overflow-hidden d-flex shadow-sm"
    :style="{ height: props.height }"
  >
    <div
      v-for="seg in computedSegments"
      :key="seg.label"
      :class="[
        seg.color.startsWith('bg-') ? seg.color : '',
        'text-center py-1 text-caption text-white font-weight-bold transition-all',
      ]"
      :style="[
        { width: seg.percent + '%' },
        !seg.color.startsWith('bg-') ? { backgroundColor: seg.color } : {},
      ]"
    >
      <span v-if="props.showLabels && seg.percent >= props.minLabelPercent">
        {{ seg.label ? `${seg.label} (${seg.percent}%)` : `${seg.percent}%` }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ISegment } from '@shared/types/ISegment.types'

const props = withDefaults(
  defineProps<{
    segments: ISegment[]
    height?: string
    showLabels?: boolean
    minLabelPercent?: number
  }>(),
  {
    height: '24px',
    showLabels: true,
    minLabelPercent: 12,
  },
)

const computedSegments = computed(() => {
  const total = props.segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0)
  return props.segments
    .map((seg) => {
      const val = Math.max(0, seg.value)
      const percent = total > 0 ? Math.round((val / total) * 100) : 0
      return {
        ...seg,
        percent,
      }
    })
    .filter((seg) => seg.percent > 0)
})
</script>

<style scoped>
.distribution-bar {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

/* A slice never spills its label into its neighbour */
.distribution-bar > div {
  overflow: hidden;
  white-space: nowrap;
}
.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
