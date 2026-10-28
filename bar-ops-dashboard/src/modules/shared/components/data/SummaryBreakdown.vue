<template>
  <div>
    <div v-if="title" class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
      {{ title }}
    </div>

    <v-table density="compact" class="summary-breakdown rounded-xl">
      <thead>
        <tr>
          <th class="text-start text-caption font-weight-bold">{{ rowLabel }}</th>
          <th
            v-for="column in columns"
            :key="column.key"
            class="text-caption font-weight-bold"
            :class="[`text-${column.align ?? 'end'}`, headerColor(column)]"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>
            <div class="d-flex align-center ga-2 py-1">
              <v-icon v-if="row.icon" :icon="row.icon" size="16" :color="row.iconColor" />
              <span class="text-caption">{{ row.label }}</span>
            </div>
          </td>
          <td
            v-for="column in columns"
            :key="column.key"
            class="text-caption font-weight-bold"
            :class="[`text-${column.align ?? 'end'}`, cellColor(column, row.values[column.key])]"
          >
            {{ formatSummaryValue(row.values[column.key] ?? 0, column.format) }}
          </td>
        </tr>
      </tbody>

      <tfoot v-if="totals">
        <tr class="summary-breakdown__total">
          <td>
            <strong class="text-caption">{{ totalLabel }}</strong>
          </td>
          <td
            v-for="column in columns"
            :key="column.key"
            class="text-caption font-weight-bold"
            :class="[`text-${column.align ?? 'end'}`, cellColor(column, totals[column.key])]"
          >
            {{ formatSummaryValue(totals[column.key] ?? 0, column.format) }}
          </td>
        </tr>
      </tfoot>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import {
  resolveTone,
  type ISummaryColumn,
  type ISummaryRow,
} from '@shared/types/ISummaryMetric.types'
import { formatSummaryValue } from '@shared/utils/formatters.util'

withDefaults(
  defineProps<{
    columns: ISummaryColumn[]
    rows: ISummaryRow[]
    totals?: Record<string, number>
    title?: string
    rowLabel?: string
    totalLabel?: string
  }>(),
  {
    rowLabel: 'קטגוריה',
    totalLabel: 'סה"כ',
  },
)

// A header takes the column tone only when that tone is sign-independent.
const headerColor = (column: ISummaryColumn) => {
  if (!column.tone || column.tone === 'net') return ''
  return `text-${resolveTone(column.tone)}`
}

const cellColor = (column: ISummaryColumn, value?: number) => {
  if (!column.tone) return ''
  return `text-${resolveTone(column.tone, value ?? 0)}`
}
</script>

<style scoped>
.summary-breakdown {
  border: 1px solid rgb(var(--v-theme-outline));
}

/* Narrow screens scroll the columns rather than clipping them */
.summary-breakdown :deep(.v-table__wrapper) {
  overflow-x: auto;
}

.summary-breakdown :deep(th),
.summary-breakdown :deep(td) {
  white-space: nowrap;
}

.summary-breakdown__total {
  background: rgba(var(--v-theme-primary), 0.04);
}
</style>
