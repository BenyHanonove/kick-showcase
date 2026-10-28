<template>
  <ModuleSummaryCard
    title="ניתוח טיפים מעמיק"
    icon="mdi-hand-coin-outline"
    icon-color="amber-darken-2"
    title-color="rgb(180, 120, 0)"
  >
    <v-row dir="rtl">
      <!-- Cash vs Credit Tips -->
      <v-col cols="12" md="4" class="text-right">
        <div class="text-body-2 font-weight-medium d-flex align-center ga-2 mb-2">
          <v-icon icon="mdi-credit-card-check-outline" size="18" />
          תמהיל טיפים (מזומן / אשראי)
        </div>
        <template v-if="tipsByType.cash + tipsByType.credit > 0">
          <DistributionBar :segments="tipsByTypeSegments" class="mb-2" />
          <div class="d-flex ga-3 text-body-2">
            <span
              >מזומן: <strong class="text-success">₪{{ formatNumber(tipsByType.cash) }}</strong></span
            >
            <span
              >אשראי: <strong class="text-info">₪{{ formatNumber(tipsByType.credit) }}</strong></span
            >
          </div>
        </template>
        <div v-else class="text-caption text-medium-emphasis">אין נתוני טיפים</div>
      </v-col>

      <!-- Bar vs Tables Tips -->
      <v-col cols="12" md="4" class="text-right">
        <div class="text-body-2 font-weight-medium d-flex align-center ga-2 mb-2">
          <v-icon icon="mdi-store-outline" size="18" />
          טיפים לפי אזור (בר / שולחנות)
        </div>
        <template v-if="tipsByArea.bar + tipsByArea.tables > 0">
          <DistributionBar :segments="tipsByAreaSegments" class="mb-2" />
          <div class="d-flex ga-3 text-body-2">
            <span
              >בר: <strong class="text-indigo">₪{{ formatNumber(tipsByArea.bar) }}</strong></span
            >
            <span
              >שולחנות: <strong class="text-teal">₪{{ formatNumber(tipsByArea.tables) }}</strong></span
            >
          </div>
        </template>
        <div v-else class="text-caption text-medium-emphasis">אין נתוני טיפים לפי אזור</div>
      </v-col>

      <!-- Tips per man-hour -->
      <v-col cols="12" md="4" class="text-right">
        <div class="text-body-2 font-weight-medium d-flex align-center ga-2 mb-2">
          <v-icon icon="mdi-timer-outline" size="18" />
          יעילות טיפים לשעה
        </div>
        <div class="text-h6 font-weight-bold tips-hourly-value">
          ₪{{ formatNumber(tipsPerManHour) }} לשעה
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          ₪{{ formatNumber(tipPerformance.totalTips) }} טיפים / {{ formatNumber(totalManHours) }} שעות
          עבודה
        </div>
      </v-col>
    </v-row>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore } from '@stores'
import { ServiceArea } from '@tips/types/ServiceArea.types'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import { formatNumber } from '@shared/utils/formatters.util'
import DistributionBar from '@shared/components/data/DistributionBar.vue'

const sessionStore = SessionStore()

const tips = computed(() => sessionStore.tips?.data || [])
const shifts = computed(() => sessionStore.registeredShifts)
const cashiers = computed(() => sessionStore.cashiers?.data || [])

const totalManHours = computed(() => {
  return shifts.value.reduce((sum, s) => sum + (s.totalHours || 0), 0)
})

const cashierSum = computed(() => {
  return cashiers.value.reduce((sum, c) => {
    return sum + (c.cash || 0) + (c.credit || 0) - (c.creditTip || 0)
  }, 0)
})

const tipPerformance = computed(() => {
  const totalTips = tips.value.reduce((sum, t) => {
    return sum + (t.cashTip || 0) + (t.creditTip || 0)
  }, 0)
  const percent = cashierSum.value > 0 ? (totalTips / cashierSum.value) * 100 : 0
  return { totalTips, cashierSum: cashierSum.value, percent }
})

const tipsByArea = computed(() => {
  const sumArea = (area: ServiceArea) =>
    tips.value
      .filter((t) => t.area === area)
      .reduce((sum, t) => sum + (t.cashTip || 0) + (t.creditTip || 0), 0)
  const bar = sumArea(ServiceArea.BAR)
  const tables = sumArea(ServiceArea.TABLES)
  return {
    bar,
    tables,
  }
})

const tipsByAreaSegments = computed(() => [
  { label: 'בר', value: tipsByArea.value.bar, color: 'bg-indigo' },
  { label: 'שולחנות', value: tipsByArea.value.tables, color: 'bg-teal' },
])

const tipsByType = computed(() => {
  const cash = tips.value.reduce((sum, t) => sum + (t.cashTip || 0), 0)
  const credit = tips.value.reduce((sum, t) => sum + (t.creditTip || 0), 0)
  return {
    cash,
    credit,
  }
})

const tipsByTypeSegments = computed(() => [
  { label: 'מזומן', value: tipsByType.value.cash, color: 'bg-success' },
  { label: 'אשראי', value: tipsByType.value.credit, color: 'bg-info' },
])

const tipsPerManHour = computed(() => {
  const totalTips = tips.value.reduce((sum, t) => sum + (t.cashTip || 0) + (t.creditTip || 0), 0)
  return totalManHours.value > 0 ? totalTips / totalManHours.value : 0
})
</script>

<style scoped>
.distribution-bar {
  height: 24px;
  background: rgba(128, 128, 128, 0.08);
}

/* Amber accent for the tips-per-hour metric */
.tips-hourly-value {
  color: rgb(180, 120, 0);
}
</style>
