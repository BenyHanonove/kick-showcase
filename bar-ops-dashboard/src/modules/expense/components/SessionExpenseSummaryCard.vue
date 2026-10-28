<template>
  <ModuleSummaryCard
    title="סיכום תמהיל הוצאות"
    icon="mdi-tag-multiple-outline"
    icon-color="info"
    title-color="text-info"
  >
    <div class="d-flex flex-column ga-2" dir="rtl">
      <!-- Distribution Bar Graph -->
      <div class="metric-row">
        <div class="text-body-2 font-weight-medium d-flex align-center ga-2 mb-2">
          <v-icon icon="mdi-chart-pie" size="18" />
          תמהיל הוצאות (לקוח / הבית / טיפ)
        </div>
        <template v-if="totalExpenses > 0">
          <DistributionBar :segments="expenseSegments" class="mb-2" />
          <!-- Original Prices Breakdown -->
          <div class="d-flex flex-wrap ga-4 text-body-2 mb-1 justify-start">
            <span
              >לקוח:
              <strong class="text-info">₪{{ formatNumber(expensesByPaidBy.client) }}</strong></span
            >
            <span
              >הבית:
              <strong class="text-warning">₪{{ formatNumber(expensesByPaidBy.house) }}</strong></span
            >
            <span
              >טיפ:
              <strong class="text-error">₪{{ formatNumber(expensesByPaidBy.tips) }}</strong></span
            >
          </div>

          <v-divider class="my-3 border-opacity-50" color="primary" />

          <!-- Total Expenses Row -->
          <v-row class="rounded pa-3 mt-3 align-center" no-gutters>
            <v-col cols="12" sm="5" class="text-right text-body-2 font-weight-bold">
              סה״כ הוצאות אירוע:
            </v-col>
            <v-col
              cols="12"
              sm="7"
              class="text-left text-body-2 font-weight-bold d-flex justify-sm-end justify-start ga-2 mt-sm-0 mt-1"
            >
              <span>לא כולל: ₪{{ formatNumber(totalExpenses) }}</span>
              <span>|</span>
              <span>כולל: ₪{{ formatNumber(addVat(totalExpenses)) }}</span>
            </v-col>
          </v-row>
        </template>
        <div v-else class="text-caption text-medium-emphasis">אין נתוני הוצאות</div>
      </div>
    </div>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore } from '@stores'
import { ExpensePaidBy } from '@expense/types/PaidBy.types'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import { formatNumber } from '@shared/utils/formatters.util'
import { addVat } from '@shared/utils/vat.util'
import DistributionBar from '@shared/components/data/DistributionBar.vue'

const sessionStore = SessionStore()

const expenses = computed(() => sessionStore.expenses?.data || [])

const expensesByPaidBy = computed(() => {
  const sumBy = (type: ExpensePaidBy) =>
    expenses.value.filter((e) => e.paidBy === type).reduce((sum, e) => sum + (e.amount || 0), 0)
  return {
    tips: sumBy(ExpensePaidBy.TIPS),
    client: sumBy(ExpensePaidBy.CLIENT),
    house: sumBy(ExpensePaidBy.HOUSE),
  }
})

const totalExpenses = computed(() => {
  return expensesByPaidBy.value.tips + expensesByPaidBy.value.client + expensesByPaidBy.value.house
})

const expenseSegments = computed(() => [
  { label: '', value: expensesByPaidBy.value.client, color: 'bg-info' },
  { label: '', value: expensesByPaidBy.value.house, color: 'bg-warning' },
  { label: '', value: expensesByPaidBy.value.tips, color: 'bg-error' },
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
</style>
