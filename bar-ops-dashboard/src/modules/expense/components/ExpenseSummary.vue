<template>
  <v-container v-if="hasExpenses" class="pa-0 mb-6">
    <!-- Header Toggle Card -->
    <v-card
      variant="flat"
      class="toggle-header rounded-xl border pa-3 d-flex align-center justify-space-between cursor-pointer transition-all shadow-sm mb-2"
      @click="isOpen = !isOpen"
    >
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-chart-box-outline" color="error" />
        <span class="text-subtitle-1 font-weight-bold">סיכום הוצאות סשן</span>
        <v-icon
          :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="small"
          class="text-medium-emphasis"
        />
      </div>

      <!-- Quick Inline Summary when closed -->
      <v-expand-x-transition>
        <div v-show="!isOpen" class="d-flex align-center ga-3 text-caption text-medium-emphasis">
          <span
            >סה"כ: <strong class="text-error text-body-2">₪{{ totals.all }}</strong></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >בית: <span class="text-emerald font-weight-bold">₪{{ totals.house }}</span></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >טיפים: <span class="text-amber font-weight-bold">₪{{ totals.tips }}</span></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >לקוח: <span class="text-indigo font-weight-bold">₪{{ totals.client }}</span></span
          >
        </div>
      </v-expand-x-transition>
    </v-card>

    <!-- Collapsible Summary Content -->
    <v-expand-transition>
      <div
        v-show="isOpen"
        class="summary-body rounded-xl border pa-4 bg-summary-body mb-2 shadow-sm"
      >
        <!-- Expense Distribution Bar -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
            התפלגות הוצאות הסשן:
          </div>
          <div class="distribution-bar rounded-lg overflow-hidden d-flex shadow-sm">
            <div
              class="bg-emerald text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: housePercent + '%' }"
              v-if="housePercent > 0"
            >
              בית ({{ housePercent }}%)
            </div>
            <div
              class="bg-amber text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: tipsPercent + '%' }"
              v-if="tipsPercent > 0"
            >
              טיפים ({{ tipsPercent }}%)
            </div>
            <div
              class="bg-indigo text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: clientPercent + '%' }"
              v-if="clientPercent > 0"
            >
              לקוח ({{ clientPercent }}%)
            </div>
          </div>
        </div>

        <!-- Summary Metrics Cards Grid -->
        <v-row dense>
          <!-- House Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-home-outline" color="emerald" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">הוצאות בית</div>
              <div class="text-h5 font-weight-black text-emerald mt-1">₪{{ totals.house }}</div>
            </v-card>
          </v-col>

          <!-- Tips Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-hand-coin-outline" color="amber" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">הוצאות טיפים</div>
              <div class="text-h5 font-weight-black text-amber mt-1">₪{{ totals.tips }}</div>
            </v-card>
          </v-col>

          <!-- Client Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-account-outline" color="indigo" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">הוצאות לקוח</div>
              <div class="text-h5 font-weight-black text-indigo mt-1">₪{{ totals.client }}</div>
            </v-card>
          </v-col>

          <!-- Overall Total Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-sigma" color="error" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ הוצאות</div>
              <div class="text-h5 font-weight-black text-error mt-1">₪{{ totals.all }}</div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { SessionStore } from '@stores'

import { ExpensePaidBy } from '@expense/types/PaidBy.types'

const sessionStore = SessionStore()

// Initialize state
const isOpen = ref(false)

const expenses = computed(() => sessionStore.expenses?.data || [])
const hasExpenses = computed(() => expenses.value.length > 0)

// Totals calculation
const totals = computed(() => {
  return expenses.value.reduce(
    (acc, curr) => {
      const amount = curr.amount || 0
      if (curr.paidBy === ExpensePaidBy.HOUSE) {
        acc.house += amount
      } else if (curr.paidBy === ExpensePaidBy.TIPS) {
        acc.tips += amount
      } else if (curr.paidBy === ExpensePaidBy.CLIENT) {
        acc.client += amount
      }
      acc.all += amount
      return acc
    },
    { house: 0, tips: 0, client: 0, all: 0 },
  )
})

// Percentages
const totalSumForPercent = computed(() => {
  return totals.value.all || 1
})
const housePercent = computed(() =>
  Math.round((totals.value.house / totalSumForPercent.value) * 100),
)
const tipsPercent = computed(() => Math.round((totals.value.tips / totalSumForPercent.value) * 100))
const clientPercent = computed(() =>
  Math.round((totals.value.client / totalSumForPercent.value) * 100),
)
</script>

<style scoped>
.toggle-header {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.toggle-header:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.summary-body {
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.metric-card {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.bg-emerald {
  background-color: rgb(16, 185, 129) !important;
}
.text-emerald {
  color: rgb(16, 185, 129) !important;
}

.bg-amber {
  background-color: rgb(245, 158, 11) !important;
}
.text-amber {
  color: rgb(245, 158, 11) !important;
}

.bg-indigo {
  background-color: rgb(99, 102, 241) !important;
}
.text-indigo {
  color: rgb(99, 102, 241) !important;
}

.distribution-bar {
  height: 24px;
  background: rgba(128, 128, 128, 0.08);
}

.bg-summary-body {
  background: transparent !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
