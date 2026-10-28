<template>
  <v-card class="summary-panel rounded-xl" variant="flat">
    <div
      class="summary-header d-flex align-center justify-space-between ga-3 pa-4"
      :class="{ 'summary-header--interactive': collapsible }"
      :role="collapsible ? 'button' : undefined"
      :tabindex="collapsible ? 0 : undefined"
      :aria-expanded="collapsible ? isOpen : undefined"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <div class="d-flex align-center ga-2 summary-title">
        <v-icon :icon="icon" :color="color" />
        <span class="text-subtitle-1 font-weight-bold text-truncate">{{ title }}</span>
        <v-icon
          v-if="collapsible"
          :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="small"
          class="text-medium-emphasis"
        />
      </div>

      <!-- Glance figures stand in for the panel while it is collapsed -->
      <div v-if="collapsible && !isOpen" class="d-none d-sm-flex align-center ga-2">
        <slot name="glance">
          <template v-for="(metric, index) in glanceMetrics" :key="metric.key">
            <v-divider v-if="index > 0" vertical class="mx-1" />
            <span class="text-caption text-medium-emphasis">
              {{ metric.shortLabel ?? metric.label }}:
              <strong class="text-body-2" :class="`text-${toneColor(metric)}`">
                {{ formatSummaryValue(metric.value, metric.format) }}
              </strong>
            </span>
          </template>
        </slot>
      </div>

      <slot name="actions" />
    </div>

    <v-expand-transition>
      <div v-show="isOpen">
        <v-divider />
        <div class="pa-4">
          <v-row v-if="metrics.length" dense class="mb-4">
            <v-col v-for="metric in metrics" :key="metric.key" v-bind="colProps">
              <MetricCard
                :icon="metric.icon"
                :icon-color="toneColor(metric)"
                :label="metric.label"
                :value="formatSummaryValue(metric.value, metric.format)"
                :value-color="toneColor(metric)"
                :caption="metric.caption"
                :active="metric.tone === 'net'"
                :active-color="toneColor(metric)"
              />
            </v-col>
          </v-row>

          <!-- The spine: same bar, same position, in every summary -->
          <div v-if="segments.length" class="mb-4">
            <div
              v-if="barLabel"
              class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis"
            >
              {{ barLabel }}
            </div>
            <DistributionBar :segments="segments" />
          </div>

          <slot />
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MetricCard from '@shared/components/data/MetricCard.vue'
import DistributionBar from '@shared/components/data/DistributionBar.vue'
import { resolveTone, type ISummaryMetric } from '@shared/types/ISummaryMetric.types'
import type { ISegment } from '@shared/types/ISegment.types'
import { formatSummaryValue } from '@shared/utils/formatters.util'

const props = withDefaults(
  defineProps<{
    title: string
    icon: string
    color?: string
    metrics?: ISummaryMetric[]
    segments?: ISegment[]
    barLabel?: string
    collapsible?: boolean
  }>(),
  {
    color: 'primary',
    metrics: () => [],
    segments: () => [],
    collapsible: false,
  },
)

const open = defineModel<boolean>('open', { default: false })

// A non-collapsible panel ignores `open` and stays expanded.
const isOpen = computed(() => !props.collapsible || open.value)

const toggle = () => {
  if (props.collapsible) open.value = !open.value
}

const toneColor = (metric: ISummaryMetric) => resolveTone(metric.tone, metric.value)

// The metric grid adapts to how many figures the summary reports.
const colProps = computed(() => {
  const count = props.metrics.length
  if (count <= 1) return { cols: 12 }
  if (count === 2) return { cols: 12, sm: 6 }
  if (count === 3) return { cols: 12, sm: 4 }
  return { cols: 12, sm: 6, md: 3 }
})

const glanceMetrics = computed(() => props.metrics.slice(0, 3))
</script>

<style scoped>
.summary-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline));
  box-shadow: var(--bo-shadow-card);
}

.summary-title {
  min-width: 0;
}

.summary-header--interactive {
  cursor: pointer;
  transition: var(--bo-transition-fast);
}

.summary-header--interactive:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.summary-header:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
</style>
