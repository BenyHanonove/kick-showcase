<template>
  <v-card
    variant="flat"
    class="cashier-group-card pa-3 pa-sm-4 rounded-xl border mb-3 transition-all"
    :class="[isExpanded ? 'group-expanded' : '', themeClass]"
  >
    <!-- Header Row (Clickable to Expand/Collapse) -->
    <div
      class="d-flex justify-space-between align-center cursor-pointer select-none"
      @click="isExpanded = !isExpanded"
    >
      <div class="d-flex align-center ga-2 ga-sm-3">
        <!-- Group checkbox in select mode -->
        <v-checkbox-btn
          v-if="props.isSelectMode"
          :model-value="isGroupFullySelected"
          :indeterminate="isGroupPartiallySelected"
          :color="themeColor"
          density="compact"
          @click.stop
          @update:model-value="toggleGroupSelection"
        />
        <v-avatar :color="themeColor" variant="tonal" size="40" class="rounded-lg">
          <v-icon icon="mdi-tag-multiple-outline" size="22" />
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-black leading-tight">
            קבוצה: {{ props.groupName }}
          </div>
          <div class="text-caption text-medium-emphasis mt-0.5">
            {{ props.cashiers.length }} קופות בקבוצה
          </div>
        </div>
      </div>

      <div class="d-flex align-center ga-3">
        <div class="d-flex flex-column align-end">
          <span class="text-caption text-medium-emphasis leading-tight">סה"כ קבוצה (נטו)</span>
          <div class="text-subtitle-1 font-weight-black" :class="`text-${themeColor}`">
            ₪{{ totalNet.toFixed(2) }}
          </div>
        </div>
        <AppButton
          icon
          variant="text"
          size="small"
          class="expansion-chevron"
          :class="{ 'chevron-rotated': isExpanded }"
        >
          <v-icon icon="mdi-chevron-down" />
        </AppButton>
      </div>
    </div>

    <!-- Summary Metrics (Visible when Collapsed) -->
    <v-expand-transition>
      <div v-if="!isExpanded" class="mt-3">
        <v-divider class="my-2 opacity-60" />
        <div class="d-flex ga-2 justify-space-between justify-sm-start flex-wrap mt-1">
          <div
            class="breakdown-item bg-success-light text-success px-2 py-1 rounded-lg text-caption font-weight-bold"
          >
            <v-icon icon="mdi-cash" size="14" class="me-1" />
            <span>מזומן: ₪{{ totalCash.toFixed(2) }}</span>
          </div>
          <div
            class="breakdown-item bg-info-light text-info px-2 py-1 rounded-lg text-caption font-weight-bold"
          >
            <v-icon icon="mdi-credit-card-outline" size="14" class="me-1" />
            <span>אשראי: ₪{{ totalCredit.toFixed(2) }}</span>
          </div>
          <div
            class="breakdown-item bg-warning-light text-warning px-2 py-1 rounded-lg text-caption font-weight-bold"
          >
            <v-icon icon="mdi-hand-coin-outline" size="14" class="me-1" />
            <span>טיפ: ₪{{ totalTip.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </v-expand-transition>

    <!-- Expanded Cards List -->
    <v-expand-transition>
      <div v-if="isExpanded" class="mt-4 expanded-container">
        <v-divider class="mb-4 opacity-60" />
        <div class="d-flex flex-column ga-2">
          <CashierCard
            v-for="(item, index) in props.cashiers"
            :key="item.id"
            :cashier="item"
            :index="index"
            :is-select-mode="props.isSelectMode"
            :is-selected="props.selectedIds?.includes(item.id)"
            @edit="(c) => emit('edit', c)"
            @delete="(c) => emit('delete', c)"
            @receipt="(c) => emit('receipt', c)"
            @select-change="(val) => emit('select-change', item.id, val)"
          />
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CashierCard from './CashierCard.vue'
import { CashierLocation } from '@cashier/types/CashierLocation.types'
import type { ICashier } from '@cashier/types/ICashier.types'

const props = defineProps<{
  groupName: string
  cashiers: ICashier[]
  isSelectMode?: boolean
  selectedIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'edit', cashier: ICashier): void
  (e: 'delete', cashier: ICashier): void
  (e: 'receipt', cashier: ICashier): void
  (e: 'select-change', id: string, value: boolean): void
  (e: 'select-group', ids: string[], value: boolean): void
}>()

const isExpanded = ref(false)

// Group selection state
const isGroupFullySelected = computed(
  () => props.cashiers.length > 0 && props.cashiers.every((c) => props.selectedIds?.includes(c.id)),
)
const isGroupPartiallySelected = computed(
  () => !isGroupFullySelected.value && props.cashiers.some((c) => props.selectedIds?.includes(c.id)),
)

const toggleGroupSelection = () => {
  const ids = props.cashiers.map((c) => c.id)
  emit('select-group', ids, !isGroupFullySelected.value)
}

// Styling color based on first cashier's location
const isBar = computed(() => {
  const first = props.cashiers[0]
  return !!first && first.location === CashierLocation.BAR
})

const themeColor = computed(() => (isBar.value ? 'primary' : 'teal'))
const themeClass = computed(() => (isBar.value ? 'bar-group-card' : 'tables-group-card'))

// Computed sums
const totalCash = computed(() => props.cashiers.reduce((sum, c) => sum + c.cash, 0))
const totalCredit = computed(() => props.cashiers.reduce((sum, c) => sum + c.credit, 0))
const totalTip = computed(() => props.cashiers.reduce((sum, c) => sum + c.creditTip, 0))
const totalNet = computed(() =>
  props.cashiers.reduce((sum, c) => sum + (c.cash + c.credit - c.creditTip), 0),
)
</script>

<style scoped>
.cashier-group-card {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.18) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
}

.cashier-group-card:hover {
  border-color: rgba(128, 128, 128, 0.3) !important;
}

.bar-group-card.group-expanded {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
  box-shadow: 0 8px 20px -6px rgba(var(--v-theme-primary), 0.08) !important;
}

.tables-group-card.group-expanded {
  border-color: rgba(0, 150, 136, 0.4) !important;
  box-shadow: 0 8px 20px -6px rgba(0, 150, 136, 0.08) !important;
}

.expansion-chevron {
  transition: transform 0.25s ease;
}

.chevron-rotated {
  transform: rotate(180deg);
}

.breakdown-item {
  display: inline-flex;
  align-items: center;
}

.bg-success-light {
  background: rgba(76, 175, 80, 0.08);
}
.bg-info-light {
  background: rgba(33, 150, 243, 0.08);
}
.bg-warning-light {
  background: rgba(255, 152, 0, 0.08);
}

.expanded-container {
  animation: slide-down 0.25s ease-out;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
