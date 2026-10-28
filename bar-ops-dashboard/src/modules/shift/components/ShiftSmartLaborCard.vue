<template>
  <ModuleSummaryCard
    title="ניתוח כוח אדם"
    icon="mdi-account-group-outline"
    icon-color="indigo"
    title-color="rgb(99, 102, 241)"
  >
    <!-- Tip Performance -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-hand-coin-outline" size="20" />
        <span class="text-body-2 font-weight-medium">ביצועי טיפים</span>
      </div>
      <div class="d-flex align-center justify-space-between">
        <span class="text-body-2">
          ₪{{ formatNumber(tipPerformance.totalTips) }} טיפים / ₪{{
            formatNumber(tipPerformance.cashierSum)
          }}
          קופות
        </span>
        <v-chip color="warning" variant="tonal" size="small" class="font-weight-bold">
          {{ formatNumber(tipPerformance.percent) }}% אחוז שירות
        </v-chip>
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Guest to Staff Ratio -->
    <div class="metric-row">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-account-switch-outline" size="20" />
          <span class="text-body-2 font-weight-medium">יחס אורחים לאנשי צוות</span>
          <span class="text-caption text-medium-emphasis">
            {{ sessionStore.session?.peopleAmount ?? 0 }} אורחים / {{ totalStaff }} עובדים
          </span>
        </div>
        <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
          {{ guestToStaffRatio }}
        </v-chip>
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Staff Who Did Not Work -->
    <div class="metric-row">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-account-minus-outline" size="20" color="error" />
          <span class="text-body-2 font-weight-medium">עובדים שלא עלו</span>
        </div>
        <strong class="text-body-2 text-error">{{ staffWhoDidNotWorkCount }}</strong>
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Hours by role -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-clock-time-four-outline" size="20" />
        <span class="text-body-2 font-weight-medium">שעות לפי תפקיד</span>
      </div>
      <template v-if="hoursByRole.length > 0">
        <div
          v-for="item in hoursByRole"
          :key="item.role"
          class="d-flex align-center justify-space-between py-1"
        >
          <span class="text-body-2">{{ item.label }}</span>
          <span class="text-body-2 font-weight-bold">{{ formatNumber(item.hours) }} ש׳</span>
        </div>
      </template>
      <div v-else class="text-caption text-medium-emphasis">אין נתוני משמרות</div>
    </div>

    <v-divider class="my-3" />

    <!-- Bonuses paid out -->
    <div class="metric-row">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-gift-outline" size="20" />
          <span class="text-body-2 font-weight-medium">בונוסים ששולמו</span>
        </div>
        <strong class="text-body-2 text-warning">₪{{ formatNumber(totalBonuses) }}</strong>
      </div>
    </div>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore } from '@stores'
import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import { formatNumber } from '@shared/utils/formatters.util'

const sessionStore = SessionStore()

const shifts = computed(() => sessionStore.registeredShifts)
const tips = computed(() => sessionStore.tips?.data || [])
const cashiers = computed(() => sessionStore.cashiers?.data || [])

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

const totalStaff = computed(() => shifts.value.length)

const staffWhoDidNotWorkCount = computed(() => {
  return shifts.value.filter((s) => (s.totalHours || 0) === 0).length
})

// Guest-to-Staff Ratio = peopleAmount / shifts.length
const guestToStaffRatio = computed(() => {
  const people = sessionStore.session?.peopleAmount || 0
  if (totalStaff.value === 0) return 'N/A'
  return Math.round(people / totalStaff.value)
})

const totalBonuses = computed(() => {
  return shifts.value.reduce((sum, s) => {
    return (
      sum +
      (s.bonusTravel || 0) +
      (s.bonusManage || 0) +
      (s.bonusSetup || 0) +
      (s.bonusOther || 0)
    )
  }, 0)
})

const hoursByRole = computed(() => {
  const map: Partial<Record<ShiftRole, number>> = {}
  for (const shift of shifts.value) {
    const role = shift.role as ShiftRole
    if (map[role] === undefined) map[role] = 0
    map[role]! += shift.totalHours || 0
  }
  return (Object.entries(map) as [ShiftRole, number][])
    .map(([role, hours]) => ({ role, label: ShiftRoleLabels[role] || role, hours }))
    .sort((a, b) => b.hours - a.hours)
})
</script>

<style scoped>
.metric-row {
  padding: 4px 0;
}
</style>
