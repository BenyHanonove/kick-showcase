<template>
  <v-card
    variant="flat"
    class="cashier-card pa-3 pa-sm-4 rounded-xl border mb-3 transition-all animate-fade-in"
    :class="[
      locationDetails.bgClass,
      {
        'cursor-pointer': props.isSelectMode,
        'selected-card-border': props.isSelectMode && props.isSelected,
      },
    ]"
    @click="handleCardClick"
  >
    <!-- Top Row: Avatar, Title and Total -->
    <div class="d-flex justify-space-between align-center mb-3">
      <div class="d-flex align-center ga-2 ga-sm-3">
        <v-checkbox
          v-if="props.isSelectMode"
          :model-value="props.isSelected"
          @update:model-value="(val) => emit('select-change', !!val)"
          hide-details
          density="compact"
          color="primary"
          class="ma-0 pa-0 me-1"
          @click.stop
        />
        <v-avatar :color="locationDetails.color" variant="tonal" size="36" class="rounded-lg">
          <v-icon :icon="locationDetails.icon" size="20" />
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold leading-tight">
            {{ CashierLocationLabels[cashier.location] || 'קופה' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            קופה מס' {{ index + 1 }}
            <span v-if="cashier.serial" class="ms-1 font-weight-medium"
              >(סידורי: {{ cashier.serial }})</span
            >
          </div>
        </div>
      </div>

      <div class="d-flex flex-column align-end">
        <span class="text-caption text-medium-emphasis leading-tight">סה"כ נטו</span>
        <div class="text-subtitle-1 font-weight-black" :class="`text-${locationDetails.color}`">
          ₪{{ totalAmount.toFixed(2) }}
        </div>
      </div>
    </div>

    <v-divider class="my-2 opacity-60" />

    <!-- Bottom Row: Breakdown and Actions -->
    <div
      class="d-flex flex-column flex-sm-row justify-space-between align-stretch align-sm-center ga-3 mt-1"
    >
      <!-- Breakdown Metrics -->
      <div class="d-flex ga-2 justify-space-between justify-sm-start flex-grow-1">
        <div
          class="breakdown-item bg-success-light text-success px-2 py-1 rounded-lg text-caption font-weight-bold flex-grow-1 flex-sm-grow-0 justify-center"
        >
          <v-icon icon="mdi-cash" size="14" class="me-1" />
          <span>מזומן: ₪{{ cashier.cash.toFixed(2) }}</span>
        </div>
        <div
          class="breakdown-item bg-info-light text-info px-2 py-1 rounded-lg text-caption font-weight-bold flex-grow-1 flex-sm-grow-0 justify-center"
        >
          <v-icon icon="mdi-credit-card-outline" size="14" class="me-1" />
          <span>אשראי: ₪{{ cashier.credit.toFixed(2) }}</span>
        </div>
        <div
          a
          class="breakdown-item bg-warning-light text-warning px-2 py-1 rounded-lg text-caption font-weight-bold flex-grow-1 flex-sm-grow-0 justify-center"
        >
          <v-icon icon="mdi-hand-coin-outline" size="14" class="me-1" />
          <span>טיפ: ₪{{ cashier.creditTip.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Action Menu -->
      <div class="d-flex ga-2 justify-end mt-2 mt-sm-0 align-center">
        <!-- Always visible receipt button -->
        <AppButton
          :icon="cashier.receiptUrl ? 'mdi-paperclip' : 'mdi-file-image-plus-outline'"
          variant="text"
          size="small"
          :color="cashier.receiptUrl ? locationDetails.color : 'medium-emphasis'"
          class="action-btn"
          :title="cashier.receiptUrl ? 'צפה בקבלה' : 'הוסף קבלה'"
          @click="emit('receipt', cashier)"
        />
        <v-menu v-model="menuOpen">
          <template #activator="{ props: menuProps }">
            <AppButton icon variant="text" size="small" v-bind="menuProps" class="action-btn">
              <v-icon :icon="menuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
            </AppButton>
          </template>
          <AppList :actions="menuActions" />
        </v-menu>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { CashierLocation, CashierLocationLabels } from '@cashier/types/CashierLocation.types'
import type { ICashier } from '@cashier/types/ICashier.types'
import type { IListAction } from '@shared/types/IListAction.types'

const menuOpen = ref(false)

const emit = defineEmits<{
  (e: 'edit', cashier: ICashier): void
  (e: 'delete', cashier: ICashier): void
  (e: 'receipt', cashier: ICashier): void
  (e: 'select-change', value: boolean): void
}>()

const props = defineProps<{
  cashier: ICashier
  index: number
  isSelectMode?: boolean
  isSelected?: boolean
}>()

// Menu actions — destructive actions sit in their own group
const menuActions: IListAction[][] = [
  [{ title: 'עדכן', icon: 'mdi-pencil', handler: () => emit('edit', props.cashier) }],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', props.cashier) }],
]

const handleCardClick = (event: MouseEvent) => {
  if (props.isSelectMode) {
    const target = event.target as HTMLElement
    if (
      target.closest('.action-btn') ||
      target.closest('.v-btn') ||
      target.closest('.v-list') ||
      target.closest('.v-checkbox')
    ) {
      return
    }
    emit('select-change', !props.isSelected)
  }
}

const totalAmount = computed(() => {
  return props.cashier.cash + props.cashier.credit - props.cashier.creditTip
})

// Location-specific details for styling
const locationDetails = computed(() => {
  if (props.cashier.location === CashierLocation.BAR) {
    return {
      icon: 'mdi-glass-cocktail',
      color: 'primary',
      bgClass: 'bar-card-bg',
    }
  }
  return {
    icon: 'mdi-room-service-outline',
    color: 'teal',
    bgClass: 'tables-card-bg',
  }
})
</script>

<style scoped>
.cashier-card {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.cashier-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
}

.bar-card-bg:hover {
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.tables-card-bg:hover {
  border-color: rgba(0, 150, 136, 0.3) !important;
}

.breakdown-item {
  display: flex;
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

.action-btn {
  border-radius: 8px !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.cursor-pointer {
  cursor: pointer;
}

.selected-card-border {
  border-color: rgba(var(--v-theme-primary), 0.8) !important;
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.8) !important;
}
</style>
