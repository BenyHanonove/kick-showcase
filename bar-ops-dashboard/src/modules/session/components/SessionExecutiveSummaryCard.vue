<template>
  <ModuleSummaryCard
    title="המדדים המובילים (Executive Summary)"
    icon="mdi-trophy-outline"
    icon-color="primary"
    title-color="text-primary"
  >
    <v-row>
      <!-- Net Profit -->
      <v-col cols="12" sm="4">
        <MetricCard
          icon="mdi-cash-multiple"
          icon-color="success"
          label="רווח נקי מוערך"
          :value="'₪' + formatNumber(netProfit)"
          :value-color="netProfit >= 0 ? 'success' : 'error'"
          :caption="'ברוטו: ₪' + formatNumber(grossSales) + ' · עלות: ₪' + formatNumber(operationalCost)"
        />
      </v-col>
      <!-- Avg Spend per Guest -->
      <v-col cols="12" sm="4">
        <MetricCard
          icon="mdi-account-cash"
          icon-color="info"
          label="הוצאה ממוצעת לאורח"
          :value="'₪' + formatNumber(avgSpendPerGuest)"
          value-color="info"
          :caption="'סיכום קופות / ' + (sessionStore.session?.peopleAmount ?? 0) + ' משתתפים'"
        />
      </v-col>
      <!-- Labor Cost Ratio -->
      <v-col cols="12" sm="4">
        <MetricCard
          icon="mdi-trending-up"
          icon-color="warning"
          label="יחס עלות עבודה"
          :value="formatNumber(laborCostRatio) + '%'"
          value-color="warning"
          :caption="'שכר: ₪' + formatNumber(payrollCost) + ' · ברוטו: ₪' + formatNumber(grossSales)"
        />
      </v-col>
    </v-row>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore } from '@stores'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import MetricCard from '@shared/components/data/MetricCard.vue'
import {
  getGrossSales,
  getOperationalCost,
  getNetProfit,
  getPayrollCost,
  getLaborCostRatio,
} from '@session/composables/session.calc'
import { formatNumber } from '@shared/utils/formatters.util'

const sessionStore = SessionStore()

const cashiers = computed(() => sessionStore.cashiers?.data || [])
const expenses = computed(() => sessionStore.expenses?.data || [])
const consumes = computed(() => sessionStore.consumes?.data || [])
const shifts = computed(() => sessionStore.registeredShifts)

// Gross Sales: cash + credit - creditTip
const grossSales = computed(() => getGrossSales(cashiers.value))

// Operational cost: VAT-adjusted consumption charge + client expenses
const operationalCost = computed(() => getOperationalCost(consumes.value, expenses.value))

// Net Profit = grossSales - operationalCost
const netProfit = computed(() => getNetProfit(cashiers.value, consumes.value, expenses.value))

// Avg Spend per Guest = grossSales / peopleAmount
const avgSpendPerGuest = computed(() => {
  const people = sessionStore.session?.peopleAmount || 0
  return people > 0 ? grossSales.value / people : 0
})

// Payroll cost: wage cost + bonus payouts across shifts
const payrollCost = computed(() => getPayrollCost(shifts.value))

// Labor Cost Ratio = payroll cost / gross sales
const laborCostRatio = computed(() => getLaborCostRatio(shifts.value, cashiers.value))
</script>

<style scoped>
.metric-subcard {
  background: rgba(var(--v-theme-primary), 0.01) !important;
  border-color: rgba(128, 128, 128, 0.15) !important;
  transition: all 0.25s ease;
}

.metric-subcard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
