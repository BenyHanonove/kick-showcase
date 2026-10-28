<template>
  <v-container v-if="hasCashiers" class="pa-0 mb-6">
    <!-- Header Toggle Card -->
    <v-card
      variant="flat"
      class="toggle-header rounded-xl border pa-3 d-flex align-center justify-space-between cursor-pointer transition-all shadow-sm mb-2"
      @click="isOpen = !isOpen"
    >
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-chart-box-outline" color="primary" />
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
            >סה"כ:
            <strong class="text-primary text-body-2"
              >{{ compactCurrency(totals.netTotal) }}</strong
            ></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >מזומן: <span class="text-success">{{ compactCurrency(totals.cash) }}</span></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >אשראי: <span class="text-info">{{ compactCurrency(totals.credit) }}</span></span
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
        <!-- Income Distribution Bar -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
            התפלגות הכנסות הסשן:
          </div>
          <div class="distribution-bar rounded-lg overflow-hidden d-flex shadow-sm">
            <div
              class="bg-success text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: cashPercent + '%' }"
              v-if="cashPercent > 0"
            >
              מזומן ({{ cashPercent }}%)
            </div>
            <div
              class="bg-info text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: creditPercent + '%' }"
              v-if="creditPercent > 0"
            >
              אשראי ({{ creditPercent }}%)
            </div>
            <div
              class="bg-warning text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: tipPercent + '%' }"
              v-if="tipPercent > 0"
            >
              טיפ ({{ tipPercent }}%)
            </div>
          </div>
        </div>

        <!-- Summary Metrics Cards Grid -->
        <v-row dense>
          <!-- Cash Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card
              variant="flat"
              class="metric-card pa-3 rounded-xl cursor-pointer text-center transition-all h-100"
              :class="{ 'active-card cash-active border-success': activeMetric === 'cash' }"
              @click="activeMetric = 'cash'"
            >
              <v-icon icon="mdi-cash" color="success" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ מזומן</div>
              <div class="text-h5 font-weight-black text-success mt-1">
                ₪{{ totals.cash.toFixed(2) }}
              </div>
            </v-card>
          </v-col>

          <!-- Credit Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card
              variant="flat"
              class="metric-card pa-3 rounded-xl cursor-pointer text-center transition-all h-100"
              :class="{ 'active-card credit-active border-info': activeMetric === 'credit' }"
              @click="activeMetric = 'credit'"
            >
              <v-icon icon="mdi-credit-card" color="info" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ אשראי</div>
              <div class="text-h5 font-weight-black text-info mt-1">
                ₪{{ totals.credit.toFixed(2) }}
              </div>
            </v-card>
          </v-col>

          <!-- Net Credit After Processing Fee Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card
              variant="flat"
              class="metric-card pa-3 rounded-xl cursor-pointer text-center transition-all h-100"
              :class="{ 'active-card transmit-active': activeMetric === 'netCredit' }"
              @click="activeMetric = 'netCredit'"
            >
              <v-icon icon="mdi-credit-card-check" color="teal" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">אשראי לאחר עמלת סליקה</div>
              <div class="text-h5 font-weight-black text-teal mt-1">
                ₪{{ totals.netCredit.toFixed(2) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                עמלה ({{ processingFeePercent }}%): ₪{{ totals.feeAmount.toFixed(2) }}-
              </div>
            </v-card>
          </v-col>

          <!-- Credit Tip Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card
              variant="flat"
              class="metric-card pa-3 rounded-xl cursor-pointer text-center transition-all h-100"
              :class="{ 'active-card tip-active border-warning': activeMetric === 'tip' }"
              @click="activeMetric = 'tip'"
            >
              <v-icon icon="mdi-hand-coin" color="warning" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ טיפ אשראי</div>
              <div class="text-h5 font-weight-black text-warning mt-1">
                ₪{{ totals.tip.toFixed(2) }}
              </div>
            </v-card>
          </v-col>

          <!-- Overall Total Card -->
          <v-col cols="12">
            <v-card
              variant="flat"
              class="metric-card pa-3 rounded-xl cursor-pointer text-center transition-all h-100"
              :class="{ 'active-card total-active border-primary': activeMetric === 'all' }"
              @click="activeMetric = 'all'"
            >
              <v-icon icon="mdi-sigma" color="primary" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ כללי (לאחר עמלת סליקה)</div>
              <div class="text-h5 font-weight-black text-primary mt-1">
                ₪{{ totals.netTotal.toFixed(2) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                מזומן + אשראי - עמלת סליקה ({{ totals.feeAmount.toFixed(2) }}₪)
              </div>
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
import { compactCurrency } from '@shared/utils/formatters.util'

const sessionStore = SessionStore()

// Initialize state
const isOpen = ref(false)
const activeMetric = ref<'cash' | 'credit' | 'netCredit' | 'tip' | 'all' | 'creditTotal' | null>(
  'all',
)

const cashiers = computed(() => sessionStore.cashiers?.data || [])
const hasCashiers = computed(() => cashiers.value.length > 0)

// Processing fee percent from the active session
const processingFeePercent = computed(() => sessionStore.session?.processingFee ?? 0)

// Totals calculation
const totals = computed(() => {
  const result = cashiers.value.reduce(
    (acc, curr) => {
      acc.cash += (curr.cash || 0) - (curr.creditTip || 0)
      acc.credit += curr.credit || 0
      acc.tip += curr.creditTip || 0
      acc.all += (curr.cash || 0) + (curr.credit || 0) - (curr.creditTip || 0)
      acc.totalRawCash += curr.cash || 0
      return acc
    },
    { cash: 0, credit: 0, tip: 0, all: 0, totalRawCash: 0 },
  )
  const feeAmount = (result.credit * processingFeePercent.value) / 100
  return {
    ...result,
    creditTotal: result.credit + result.tip,
    feeAmount,
    netCredit: result.credit - feeAmount,
    netTotal: result.all - feeAmount,
  }
})

// Percentages
const totalSumForPercent = computed(() => {
  return totals.value.cash + totals.value.credit + totals.value.tip || 1
})
const cashPercent = computed(() => Math.round((totals.value.cash / totalSumForPercent.value) * 100))
const creditPercent = computed(() =>
  Math.round((totals.value.credit / totalSumForPercent.value) * 100),
)
const tipPercent = computed(() => Math.round((totals.value.tip / totalSumForPercent.value) * 100))
</script>

<style scoped>
.toggle-header {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.toggle-header:hover {
  background: rgba(var(--v-theme-primary), 0.02);
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

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.active-card {
  border-width: 1px !important;
}

.cash-active {
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.15) !important;
  border-color: rgb(76, 175, 80) !important;
}

.credit-active {
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.15) !important;
  border-color: rgb(33, 150, 243) !important;
}

.tip-active {
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.15) !important;
  border-color: rgb(255, 152, 0) !important;
}

.total-active {
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.15) !important;
  border-color: rgb(139, 92, 246) !important;
}

.transmit-active {
  box-shadow: 0 0 12px rgba(0, 150, 136, 0.15) !important;
  border-color: rgb(0, 150, 136) !important;
}

.distribution-bar {
  height: 24px;
  background: rgba(128, 128, 128, 0.08);
}

.bg-summary-body {
  background: rgba(var(--v-theme-primary), 0.01) !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
