<template>
  <v-container v-if="hasShifts" class="pa-0 mb-6">
    <!-- Header Toggle Card -->
    <v-card
      variant="flat"
      class="toggle-header rounded-xl border pa-3 d-flex align-center justify-space-between shadow-sm mb-2"
      @click="isOpen = !isOpen"
    >
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-calendar-clock" color="primary" />
        <!-- Small Alert Icon when closed -->
        <v-icon
          v-if="!isOpen && staffingAlerts.length > 0"
          icon="mdi-alert-circle"
          color="error"
          size="small"
          class="pulse-attention"
        />
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
            >סה"כ שעות:
            <strong class="text-primary text-body-2">{{ formattedTotalHours }}</strong></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >משמרות: <span class="text-info font-weight-bold">{{ totalShiftsCount }}</span></span
          >
          <v-divider vertical class="mx-1" />
          <span
            >בונוסים:
            <span class="text-success font-weight-bold">₪{{ totalBonusesSum }}</span></span
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
        <!-- Staffing Mismatch Alerts with a Premium Look -->
        <v-card
          v-if="staffingAlerts.length > 0"
          variant="flat"
          class="mb-5 rounded-xl border-error-subtle pa-4"
        >
          <div class="d-flex align-center ga-2 font-weight-bold mb-3">
            <v-icon icon="mdi-alert-circle" color="error" />
            <span class="text-subtitle-1">התרעות סד"ק (אי-התאמה בתקני כוח אדם)</span>
          </div>
          <div class="d-flex flex-column ga-2">
            <div
              v-for="(alert, idx) in staffingAlerts"
              :key="idx"
              class="d-flex align-center justify-space-between py-2 px-3 rounded-lg border"
              :style="{
                borderColor:
                  alert.type === 'missing'
                    ? 'rgba(var(--v-theme-error), 0.15)'
                    : 'rgba(var(--v-theme-warning), 0.25)',
                background: 'var(--v-theme-surface, #ffffff)',
              }"
            >
              <div class="d-flex align-center ga-2">
                <v-icon
                  :icon="alert.type === 'missing' ? 'mdi-account-minus' : 'mdi-account-plus'"
                  :color="alert.color"
                />
                <span class="font-weight-medium text-body-2" :class="`text-${alert.color}`">{{
                  alert.message
                }}</span>
              </div>
              <v-chip size="x-small" :color="alert.color" variant="tonal" class="font-weight-bold">
                {{ alert.type === 'missing' ? 'חסר' : 'עודף' }}
              </v-chip>
            </div>
          </div>
        </v-card>

        <!-- Hours Distribution Bar -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
            התפלגות שעות לפי תפקיד:
          </div>
          <div class="distribution-bar rounded-lg overflow-hidden d-flex shadow-sm">
            <div
              class="bg-primary text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: bartenderPercent + '%' }"
              v-if="bartenderHours > 0"
            >
              ברמנים ({{ bartenderHours }} ש')
            </div>
            <div
              class="bg-teal text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: barManagerPercent + '%' }"
              v-if="barManagerHours > 0"
            >
              מנהלי בר ({{ barManagerHours }} ש')
            </div>
            <div
              class="bg-info text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: waiterPercent + '%' }"
              v-if="waiterHours > 0"
            >
              מלצרים ({{ waiterHours }} ש')
            </div>
            <div
              class="bg-indigo text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: waiterManagerPercent + '%' }"
              v-if="waiterManagerHours > 0"
            >
              מנהלי מלצרים ({{ waiterManagerHours }} ש')
            </div>
            <div
              class="bg-warning text-center py-1 text-caption text-white font-weight-bold transition-all"
              :style="{ width: runnerPercent + '%' }"
              v-if="runnerHours > 0"
            >
              ראנרים ({{ runnerHours }} ש')
            </div>
          </div>
        </div>

        <!-- Gender Distribution Bar -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2 text-medium-emphasis">
            התפלגות מגדר ({{ uniqueEmployeesCount }} עובדים):
          </div>
          <div class="distribution-bar rounded-lg overflow-hidden d-flex shadow-sm">
            <div
              v-for="segment in genderSegments"
              :key="segment.key"
              class="text-center py-1 text-caption text-white font-weight-bold transition-all text-no-wrap"
              :class="segment.color"
              :style="{ width: segment.percent + '%' }"
            >
              {{ segment.label }} ({{ segment.count }})
            </div>
          </div>
        </div>

        <!-- Summary Metrics Cards Grid -->
        <v-row dense>
          <!-- Total Hours Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-clock-outline" color="primary" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ שעות</div>
              <div class="text-h5 font-weight-black text-primary mt-1">
                {{ formattedTotalHours }}
              </div>
            </v-card>
          </v-col>

          <!-- Total Shifts Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-calendar-multiselect" color="info" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ משמרות</div>
              <div class="text-h5 font-weight-black text-info mt-1">{{ totalShiftsCount }}</div>
            </v-card>
          </v-col>

          <!-- Total Bonuses Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-cash-plus" color="success" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">סה"כ בונוסים</div>
              <div class="text-h5 font-weight-black text-success mt-1">₪{{ totalBonusesSum }}</div>
            </v-card>
          </v-col>

          <!-- Average Hours Card -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-clock-fast" color="warning" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">ממוצע שעות למשמרת</div>
              <div class="text-h5 font-weight-black text-warning mt-1">{{ formattedAvgHours }}</div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Import stores
import { SessionStore, EmployeesStore } from '@stores'

// Import types
import { ShiftRole } from '@shift/types/ShiftRole.types'
import { EmployeeGender, EmployeeGenderLabels } from '@employee/types/EmployeeGender.types'

// Initialize stores
const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

// State
const isOpen = ref(false)

// Computed properties
const shifts = computed(() => sessionStore.registeredShifts)
const hasShifts = computed(() => shifts.value.length > 0)

const totalShiftsCount = computed(() => shifts.value.length)

// Staffing Alerts
const staffingAlerts = computed(() => {
  const session = sessionStore.session
  if (!session) return []

  const required = {
    bartender: session.barmanAmount || 0,
    barManager: session.barMangerAmount || 0,
    waiter: session.waitersAmount || 0,
    waiterManager: session.waiterMangerAmount ?? 0,
    runner: session.Runners || 0,
  }

  const actual = {
    bartender: shifts.value.filter((s) => s.role === ShiftRole.BARTENDER).length,
    barManager: shifts.value.filter((s) => s.role === ShiftRole.BAR_MANAGER).length,
    waiter: shifts.value.filter((s) => s.role === ShiftRole.WAITER).length,
    waiterManager: shifts.value.filter((s) => s.role === ShiftRole.WAITER_MANAGER).length,
    runner: shifts.value.filter((s) => s.role === ShiftRole.RUNNER).length,
  }

  const roles = [
    { key: 'bartender', label: 'ברמנים' },
    { key: 'barManager', label: 'מנהלי בר' },
    { key: 'waiter', label: 'מלצרים' },
    { key: 'waiterManager', label: 'מנהלי מלצרים' },
    { key: 'runner', label: 'ראנרים' },
  ]

  const alerts = []
  for (const role of roles) {
    const req = required[role.key as keyof typeof required]

    const act = actual[role.key as keyof typeof actual]
    const diff = act - req

    if (diff < 0) {
      alerts.push({
        role: role.label,
        type: 'missing',
        count: Math.abs(diff),
        message: `חסרים ${Math.abs(diff)} ${role.label} (שובצו ${act} מתוך ${req})`,
        color: 'error',
      })
    } else if (diff > 0) {
      alerts.push({
        role: role.label,
        type: 'overflow',
        count: diff,
        message: `עודף של ${diff} ${role.label} (שובצו ${act} מתוך ${req})`,
        color: 'warning',
      })
    }
  }
  return alerts
})

// Calculations
const totalHoursSum = computed(() => {
  return shifts.value.reduce((acc, s) => acc + (s.totalHours || 0), 0)
})

const formattedTotalHours = computed(() => {
  return Number(totalHoursSum.value.toFixed(2))
})

const totalBonusesSum = computed(() => {
  return shifts.value.reduce((acc, s) => {
    const bonuses =
      (s.bonusTravel || 0) + (s.bonusManage || 0) + (s.bonusSetup || 0) + (s.bonusOther || 0)
    return acc + bonuses
  }, 0)
})

const formattedAvgHours = computed(() => {
  if (shifts.value.length === 0) return 0
  return Number((totalHoursSum.value / shifts.value.length).toFixed(2))
})

// Distribution calculations based on hours
const hoursByRole = computed(() => {
  const counts = {
    [ShiftRole.BARTENDER]: 0,
    [ShiftRole.WAITER]: 0,
    [ShiftRole.RUNNER]: 0,
    [ShiftRole.BAR_MANAGER]: 0,
    [ShiftRole.WAITER_MANAGER]: 0,
  }
  for (const s of shifts.value) {
    if (s.role in counts) {
      counts[s.role] += s.totalHours || 0
    }
  }
  return counts
})

const totalHoursForPercent = computed(() => {
  const total = Object.values(hoursByRole.value).reduce((a, b) => a + b, 0)
  return total || 1
})

const bartenderPercent = computed(() => {
  return Math.round((hoursByRole.value[ShiftRole.BARTENDER] / totalHoursForPercent.value) * 100)
})

const waiterPercent = computed(() => {
  return Math.round((hoursByRole.value[ShiftRole.WAITER] / totalHoursForPercent.value) * 100)
})

const runnerPercent = computed(() => {
  return Math.round((hoursByRole.value[ShiftRole.RUNNER] / totalHoursForPercent.value) * 100)
})

const barManagerPercent = computed(() => {
  return Math.round((hoursByRole.value[ShiftRole.BAR_MANAGER] / totalHoursForPercent.value) * 100)
})

const waiterManagerPercent = computed(() => {
  return Math.round(
    (hoursByRole.value[ShiftRole.WAITER_MANAGER] / totalHoursForPercent.value) * 100,
  )
})

const bartenderHours = computed(() => {
  return Number(hoursByRole.value[ShiftRole.BARTENDER].toFixed(2))
})

const waiterHours = computed(() => {
  return Number(hoursByRole.value[ShiftRole.WAITER].toFixed(2))
})

const runnerHours = computed(() => {
  return Number(hoursByRole.value[ShiftRole.RUNNER].toFixed(2))
})

const barManagerHours = computed(() => {
  return Number(hoursByRole.value[ShiftRole.BAR_MANAGER].toFixed(2))
})

const waiterManagerHours = computed(() => {
  return Number(hoursByRole.value[ShiftRole.WAITER_MANAGER].toFixed(2))
})

// Gender distribution, each employee counted once even with several shifts
const uniqueEmployeeIds = computed(() => [...new Set(shifts.value.map((s) => s.employeeId))])

const uniqueEmployeesCount = computed(() => uniqueEmployeeIds.value.length)

const genderSegments = computed(() => {
  const counts = {
    [EmployeeGender.MALE]: 0,
    [EmployeeGender.FEMALE]: 0,
    [EmployeeGender.OTHER]: 0,
    unknown: 0,
  }
  for (const id of uniqueEmployeeIds.value) {
    const gender = employeesStore.get(id)?.gender
    if (gender) counts[gender]++
    else counts.unknown++
  }

  const total = uniqueEmployeesCount.value || 1
  return [
    {
      key: EmployeeGender.MALE,
      label: EmployeeGenderLabels[EmployeeGender.MALE],
      color: 'bg-blue',
      count: counts[EmployeeGender.MALE],
    },
    {
      key: EmployeeGender.FEMALE,
      label: EmployeeGenderLabels[EmployeeGender.FEMALE],
      color: 'bg-pink',
      count: counts[EmployeeGender.FEMALE],
    },
    {
      key: EmployeeGender.OTHER,
      label: EmployeeGenderLabels[EmployeeGender.OTHER],
      color: 'bg-deep-purple',
      count: counts[EmployeeGender.OTHER],
    },
    { key: 'unknown', label: 'לא צוין', color: 'bg-grey', count: counts.unknown },
  ]
    .filter((segment) => segment.count > 0)
    .map((segment) => ({ ...segment, percent: Math.round((segment.count / total) * 100) }))
})
</script>

<style scoped>
.toggle-header {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.summary-body {
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.metric-card {
  background: var(--v-theme-surface, #ffffff) !important;
  border: 1px solid rgba(128, 128, 128, 0.15) !important;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
  cursor: default !important;
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

.border-error-subtle {
  border: 1px solid rgba(var(--v-theme-error), 0.25) !important;
}

.bg-error-container {
  background: rgba(var(--v-theme-error), 0.03) !important;
}

@keyframes pulse-attention {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.pulse-attention {
  animation: pulse-attention 2s infinite ease-in-out;
}
</style>
