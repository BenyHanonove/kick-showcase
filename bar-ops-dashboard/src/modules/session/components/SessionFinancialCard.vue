<template>
  <ModuleSummaryCard
    title="אנליטיקה פיננסית ותזרים"
    icon="mdi-finance"
    icon-color="info"
    title-color="text-info"
  >
    <!-- Payment Mix -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-credit-card-check-outline" size="20" />
        <span class="text-body-2 font-weight-medium">תמהיל תשלומים</span>
      </div>
      <DistributionBar :segments="paymentSegments" class="mb-3" />
      <div class="d-flex ga-4 text-body-2 mb-1">
        <span
          >מזומן: <strong class="text-success">₪{{ formatNumber(paymentMix.cash) }}</strong></span
        >
        <span
          >אשראי: <strong class="text-info">₪{{ formatNumber(paymentMix.credit) }}</strong></span
        >
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Food Cost -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-food-outline" size="20" />
        <span class="text-body-2 font-weight-medium">עלות מזון ושתייה</span>
      </div>
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex flex-column text-body-2 text-right">
          <span
            >₪{{ formatNumber(consumeChargedSum) }}
            <span class="text-caption text-medium-emphasis">(לפני)</span></span
          >
          <span class="font-weight-bold"
            >₪{{ formatNumber(addVat(consumeChargedSum)) }}
            <span class="text-caption text-medium-emphasis">(אחרי)</span></span
          >
        </div>
        <span
          :class="
            foodCostPercent > 35
              ? 'text-error'
              : foodCostPercent > 25
                ? 'text-warning'
                : 'text-success'
          "
          class="text-body-2 font-weight-bold"
        >
          {{ formatNumber(foodCostPercent) }}% מהקופות
        </span>
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Cash Flow Health -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-heart-pulse" size="20" />
        <span class="text-body-2 font-weight-medium">בריאות תזרים מזומנים</span>
      </div>
      <div class="d-flex flex-column ga-1">
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-2">סיכום קופות (הכנסות):</span>
          <strong class="text-success">₪{{ formatNumber(cashierSum) }}</strong>
        </div>
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-2">הוצאות במקום (צריכה + לקוח):</span>
          <strong class="text-error">₪{{ formatNumber(cashFlowExpenses) }}</strong>
        </div>
        <v-divider class="my-1" />
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-2 font-weight-black">נטו:</span>
          <strong :class="cashFlowNet >= 0 ? 'text-success' : 'text-error'">
            ₪{{ formatNumber(cashFlowNet) }}
          </strong>
        </div>
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Bar vs Tables Revenue -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-store-outline" size="20" />
        <span class="text-body-2 font-weight-medium">הכנסות לפי אזור</span>
      </div>
      <DistributionBar :segments="locationSegments" class="mb-3" />
      <div class="d-flex ga-4 text-body-2">
        <span
          >בר: <strong class="text-primary">₪{{ formatNumber(revenueByLocation.bar) }}</strong></span
        >
        <span
          >שולחנות:
          <strong class="text-body-2 color-tables-bar"
            >₪{{ formatNumber(revenueByLocation.tables) }}</strong
          ></span
        >
      </div>
    </div>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore } from '@stores'
import { CashierLocation } from '@cashier/types/CashierLocation.types'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import { getConsumedCharge } from '@consume/composables/consume.calc'
import { getGrossSales, getOperationalCost, getNetProfit } from '@session/composables/session.calc'
import { formatNumber } from '@shared/utils/formatters.util'
import { addVat } from '@shared/utils/vat.util'
import DistributionBar from '@shared/components/data/DistributionBar.vue'

const sessionStore = SessionStore()

const cashiers = computed(() => sessionStore.cashiers?.data || [])
const expenses = computed(() => sessionStore.expenses?.data || [])
const consumes = computed(() => sessionStore.consumes?.data || [])

const cashierSum = computed(() => getGrossSales(cashiers.value))

// Pre-VAT charged price sum, for Food Cost display
const consumeChargedSum = computed(() => {
  return consumes.value.reduce((sum, c) => sum + getConsumedCharge(c), 0)
})

const paymentMix = computed(() => {
  const raw = cashiers.value.reduce(
    (acc, c) => {
      acc.cash += (c.cash || 0) - (c.creditTip || 0)
      acc.credit += c.credit || 0
      return acc
    },
    { cash: 0, credit: 0 },
  )
  return raw
})

const paymentSegments = computed(() => [
  { label: 'מזומן', value: paymentMix.value.cash, color: 'bg-success' },
  { label: 'אשראי', value: paymentMix.value.credit, color: 'bg-info' },
])

const foodCostPercent = computed(() => {
  return cashierSum.value > 0 ? ((addVat(consumeChargedSum.value)) / cashierSum.value) * 100 : 0
})

const cashFlowExpenses = computed(() => getOperationalCost(consumes.value, expenses.value))
const cashFlowNet = computed(() => getNetProfit(cashiers.value, consumes.value, expenses.value))

const revenueByLocation = computed(() => {
  const calcNet = (c: (typeof cashiers.value)[0]) =>
    (c.cash || 0) + (c.credit || 0) - (c.creditTip || 0)
  const bar = cashiers.value
    .filter((c) => c.location === CashierLocation.BAR)
    .reduce((sum, c) => sum + calcNet(c), 0)
  const tables = cashiers.value
    .filter((c) => c.location === CashierLocation.TABLES)
    .reduce((sum, c) => sum + calcNet(c), 0)
  return {
    bar,
    tables,
  }
})

const locationSegments = computed(() => [
  { label: 'בר', value: revenueByLocation.value.bar, color: 'bg-primary' },
  { label: 'שולחנות', value: revenueByLocation.value.tables, color: 'rgb(99, 102, 241)' },
])
</script>

<style scoped>
.distribution-bar {
  height: 24px;
  background: rgba(128, 128, 128, 0.08);
}
.metric-row {
  padding: 4px 0;
}

/* Indigo accent for the tables revenue segment */
.color-tables-bar {
  color: rgb(99, 102, 241);
  background: rgb(99, 102, 241);
}
</style>
