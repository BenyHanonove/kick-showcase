<template>
  <v-card
    variant="flat"
    class="expense-card pa-3 pa-sm-4 rounded-xl border mb-3 transition-all animate-fade-in"
  >
    <!-- Top Row: Avatar, Title and Total -->
    <div class="d-flex justify-space-between align-center mb-3">
      <div class="d-flex align-center ga-2 ga-sm-3">
        <v-avatar color="error" variant="tonal" size="36" class="rounded-lg">
          <v-icon icon="mdi-minus-circle-outline" size="20" />
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold leading-tight">
            {{ expense.name }}
          </div>
          <div class="text-caption text-medium-emphasis">הוצאה מס' {{ index + 1 }}</div>
        </div>
      </div>

      <div class="d-flex flex-column align-end">
        <span class="text-caption text-medium-emphasis leading-tight">סה"כ הוצאה</span>
        <div class="text-subtitle-1 font-weight-black text-error">₪{{ expense.amount }}</div>
        <div class="text-caption text-medium-emphasis leading-tight mt-1">
          ₪{{ amountWithVat }} כולל מע"מ
        </div>
      </div>
    </div>

    <v-divider class="my-2 opacity-60" />

    <!-- Bottom Row: Description and Actions -->
    <div
      class="d-flex flex-column flex-sm-row justify-space-between align-stretch align-sm-center ga-3 mt-1"
    >
      <!-- Badges -->
      <div class="d-flex ga-2 align-center flex-grow-1 flex-wrap">
        <!-- Description Badge -->
        <div
          class="description-badge bg-error-light text-error px-2 py-1 rounded-lg text-caption font-weight-medium flex-grow-1 flex-sm-grow-0 d-flex align-center"
        >
          <v-icon icon="mdi-text-box-outline" size="14" class="me-1" />
          <span class="text-truncate desc-text">
            {{ expense.desc || 'ללא תיאור' }}
          </span>
        </div>

        <!-- Payment Source Badge -->
        <div
          v-if="expense.paidBy"
          :class="[
            'paid-by-badge px-2 py-1 rounded-lg text-caption font-weight-medium flex-grow-1 flex-sm-grow-0 d-flex align-center',
            paidByBadge.class,
          ]"
        >
          <v-icon :icon="paidByBadge.icon" size="14" class="me-1" />
          <span>{{ paidByBadge.label }}</span>
        </div>
      </div>

      <!-- Action Menu -->
      <div class="d-flex ga-2 justify-end mt-2 mt-sm-0 align-center">
        <!-- Always visible receipt button -->
        <AppButton
          :icon="expense.receiptUrl ? 'mdi-paperclip' : 'mdi-file-image-plus-outline'"
          variant="text"
          size="small"
          :color="expense.receiptUrl ? 'error' : 'medium-emphasis'"
          class="action-btn"
          :title="expense.receiptUrl ? 'צפה בקבלה' : 'הוסף קבלה'"
          @click="emit('receipt', expense)"
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
// Import vue APIs
import { computed, ref } from 'vue'

// Import types
import { ExpensePaidBy, ExpensePaidByLabels } from '@expense/types/PaidBy.types'
import type { IExpense } from '@expense/types/IExpense.types'
import type { IListAction } from '@shared/types/IListAction.types'

import { addVat } from '@shared/utils/vat.util'

// Reactive state
const menuOpen = ref(false)

// Define emits
const emit = defineEmits<{
  (e: 'edit', expense: IExpense): void
  (e: 'delete', expense: IExpense): void
  (e: 'receipt', expense: IExpense): void
}>()

// Define props
const props = defineProps<{
  expense: IExpense
  index: number
}>()

// Computed properties
const expense = computed(() => props.expense)

// Menu actions — destructive actions sit in their own group
const menuActions: IListAction[][] = [
  [{ title: 'עדכן', icon: 'mdi-pencil', handler: () => emit('edit', expense.value) }],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', expense.value) }],
]

const amountWithVat = computed(() => {
  return addVat(expense.value.amount)
})

const paidByBadge = computed(() => {
  const value = expense.value.paidBy
  if (!value) {
    return {
      label: 'לא ידוע',
      class: 'bg-grey-light text-grey',
      icon: 'mdi-help-circle-outline',
    }
  }
  const label = ExpensePaidByLabels[value] || value

  switch (value) {
    case ExpensePaidBy.HOUSE:
      return {
        label,
        class: 'bg-emerald-light text-emerald',
        icon: 'mdi-home-outline',
      }
    case ExpensePaidBy.TIPS:
      return {
        label,
        class: 'bg-amber-light text-amber',
        icon: 'mdi-hand-coin-outline',
      }
    case ExpensePaidBy.CLIENT:
      return {
        label,
        class: 'bg-indigo-light text-indigo',
        icon: 'mdi-account-outline',
      }
    default:
      return {
        label: label || 'לא ידוע',
        class: 'bg-grey-light text-grey',
        icon: 'mdi-help-circle-outline',
      }
  }
})
</script>

<style scoped>
.expense-card {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.expense-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
  border-color: rgba(var(--v-theme-error), 0.3) !important;
}

.bg-error-light {
  background: rgba(244, 67, 54, 0.08);
}

.description-badge,
.paid-by-badge {
  display: flex;
  align-items: center;
}

.bg-emerald-light {
  background: rgba(16, 185, 129, 0.08);
}
.text-emerald {
  color: rgb(16, 185, 129);
}

.bg-amber-light {
  background: rgba(245, 158, 11, 0.08);
}
.text-amber {
  color: rgb(245, 158, 11);
}

.bg-indigo-light {
  background: rgba(99, 102, 241, 0.08);
}
.text-indigo {
  color: rgb(99, 102, 241);
}

.bg-grey-light {
  background: rgba(107, 114, 128, 0.08);
}
.text-grey {
  color: rgb(107, 114, 128);
}

.action-btn {
  border-radius: 8px !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Constrain description text width to prevent overflow in flex containers */
.desc-text {
  max-width: 250px;
}
</style>
