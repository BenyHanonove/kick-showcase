<template>
  <v-container>
    <PageHeader
      :path="['בית', 'עובדים', employeeFullName]"
      :title="employeeFullName"
      :desc="employee ? EmployeeTypeLabels[employee.type as EmployeeType] : ''"
      :min-role="UserRole.ADMIN"
    />

    <GlobalLoading v-if="loading" />

    <template v-else-if="!employee">
      <EmptyState icon="mdi-account-off-outline" feature="עובד" />
    </template>

    <template v-else>
      <v-row class="mt-2" align="stretch">
        <!-- Employee info -->
        <v-col cols="12" md="6" class="d-flex">
          <ModuleSummaryCard title="פרטי עובד" icon="mdi-account-outline" icon-color="primary" class="flex-grow-1">
            <div class="d-flex flex-column ga-3">
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">תעודת זהות</span>
                <span class="text-body-2 font-weight-medium">{{ employee.identityNumber }}</span>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">טלפון</span>
                <a
                  :href="`tel:${employee.phone}`"
                  class="text-body-2 font-weight-medium text-decoration-none text-inherit"
                >
                  {{ formatPhoneNumber(employee.phone) }}
                </a>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">כתובת</span>
                <span class="text-body-2 font-weight-medium">{{ employee.address || '—' }}</span>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">סטטוס</span>
                <v-chip size="small" variant="tonal" :color="employee.status === EmployeeStatus.APPROVED ? 'success' : 'warning'">
                  {{ EmployeeStatusLabels[employee.status as EmployeeStatus] }}
                </v-chip>
              </div>
            </div>
          </ModuleSummaryCard>
        </v-col>

        <!-- Hours & shifts summary -->
        <v-col cols="12" md="6" class="d-flex">
          <ModuleSummaryCard title="סיכום שעות ומשמרות" icon="mdi-clock-time-four-outline" icon-color="indigo" title-color="rgb(99, 102, 241)" class="flex-grow-1">
            <div class="d-flex flex-column ga-3">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-timer-sand" size="20" />
                  <span class="text-body-2 font-weight-medium">סה״כ שעות</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{ formatNumber(totalHours) }} ש׳</span>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-calendar-check-outline" size="20" />
                  <span class="text-body-2 font-weight-medium">סה״כ משמרות</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{ shifts.length }}</span>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-gift-outline" size="20" />
                  <span class="text-body-2 font-weight-medium">סה״כ בונוסים</span>
                </div>
                <span class="text-body-2 font-weight-bold text-warning">{{ formatCurrency(totalBonuses) }}</span>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-mailbox-open-outline" size="20" />
                  <span class="text-body-2 font-weight-medium">מעטפות שהתקבלו</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{ receivedCount }} / {{ shifts.length }}</span>
              </div>
              <v-divider />
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-cash-multiple" size="20" />
                  <span class="text-body-2 font-weight-medium">סה״כ לתשלום</span>
                </div>
                <span class="text-body-2 font-weight-bold text-success">{{ formatCurrency(totalPay) }}</span>
              </div>
            </div>
          </ModuleSummaryCard>
        </v-col>
      </v-row>

      <div class="mt-6">
        <h6 class="text-h6 font-weight-bold mb-3">היסטוריית משמרות</h6>
        <AppTable
          :headers="shiftHeaders"
          :items="shiftRows"
          :loading="shiftsLoading"
          empty-icon="mdi-calendar-blank-outline"
          empty-feature="משמרות"
        >
          <template #role="{ value }">
            {{ ShiftRoleLabels[value as ShiftRole] ?? value }}
          </template>

          <template #timing="{ value }">
            {{ value ? formatDate(value as string, { day: 'numeric', month: 'long', year: 'numeric' }) : '—' }}
          </template>

          <template #totalHours="{ value }"> {{ formatNumber(value as number) }} ש׳ </template>

          <template #hourly="{ value }">
            {{ value ? formatCurrency(value as number) : '—' }}
          </template>

          <template #bonusesTotal="{ value }"> {{ formatCurrency(value as number) }} </template>

          <template #payTotal="{ value }">
            <span class="font-weight-bold text-success">{{ formatCurrency(value as number) }}</span>
          </template>

          <template #approved="{ value }">
            <v-chip size="small" variant="tonal" :color="value ? 'success' : 'default'">
              {{ value ? 'אושר' : 'ממתין' }}
            </v-chip>
          </template>

          <template #received="{ item }">
            <v-chip
              size="small"
              variant="tonal"
              :color="item.received ? 'success' : 'default'"
              :disabled="togglingReceivedId === item.id"
              class="cursor-pointer"
              @click="toggleReceived(item)"
            >
              <v-progress-circular v-if="togglingReceivedId === item.id" size="14" width="2" indeterminate class="me-1" />
              {{ item.received ? 'התקבלה' : 'לא התקבלה' }}
            </v-chip>
          </template>
        </AppTable>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { EmployeesStore, SnackbarStore } from '@stores'

import { shiftProvider } from '@shift/providers/shift.provider'

import { UserRole } from '@auth/types/IUser.types'
import { EmployeeType, EmployeeTypeLabels } from '@employee/types/EmployeeType.types'
import { EmployeeStatus, EmployeeStatusLabels } from '@employee/types/EmployeeStatus.types'
import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import type { IShift } from '@shift/types/IShift.types'

import { formatPhoneNumber, formatNumber, formatCurrency, formatDate } from '@shared/utils/formatters.util'

import PageHeader from '@shared/components/layout/PageHeader.vue'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import AppTable, { type TableHeader } from '@shared/components/data/AppTable.vue'

const route = useRoute()
const employeesStore = EmployeesStore()

const employeeId = route.params.id as string
const employee = computed(() => employeesStore.get(employeeId))
const loading = computed(() => employeesStore.loading && !employee.value)

const employeeFullName = computed(() =>
  employee.value ? `${employee.value.firstName} ${employee.value.lastName}` : 'עובד',
)

// Shifts for this employee, fetched directly (not session-scoped)
const shifts = ref<IShift[]>([])
const shiftsLoading = ref(false)

onMounted(async () => {
  shiftsLoading.value = true
  const result = await shiftProvider.list({ employeeId })
  if (result.success && result.data) {
    shifts.value = result.data
  } else {
    SnackbarStore().open(result.message || 'שגיאה בטעינת משמרות העובד', 'error')
  }
  shiftsLoading.value = false
})

const totalHours = computed(() => shifts.value.reduce((sum, s) => sum + (s.totalHours || 0), 0))

const totalBonuses = computed(() =>
  shifts.value.reduce(
    (sum, s) =>
      sum + (s.bonusTravel || 0) + (s.bonusManage || 0) + (s.bonusSetup || 0) + (s.bonusOther || 0),
    0,
  ),
)

const receivedCount = computed(() => shifts.value.filter((s) => s.received).length)

// Total owed: bonuses + hours * hourly rate, all shifts
const totalPay = computed(() =>
  shifts.value.reduce(
    (sum, s) =>
      sum +
      (s.bonusTravel || 0) +
      (s.bonusManage || 0) +
      (s.bonusSetup || 0) +
      (s.bonusOther || 0) +
      (s.totalHours || 0) * (s.hourly || 0),
    0,
  ),
)

// Toggle envelope-received status inline from the shift table
const togglingReceivedId = ref<string | null>(null)

const toggleReceived = async (shift: IShift) => {
  if (togglingReceivedId.value) return
  togglingReceivedId.value = shift.id
  const nextReceived = !shift.received
  const result = await shiftProvider.update(shift.id, {
    id: shift.id,
    timestamp: shift.timestamp,
    received: nextReceived,
  })
  if (result.success && result.data) {
    const index = shifts.value.findIndex((s) => s.id === shift.id)
    if (index !== -1) shifts.value[index] = result.data
    SnackbarStore().open(
      nextReceived ? 'המעטפה סומנה כהתקבלה' : 'סימון קבלת המעטפה בוטל',
      'success',
    )
  } else {
    SnackbarStore().open(result.message || 'שגיאה בעדכון קבלת מעטפה', 'error')
  }
  togglingReceivedId.value = null
}

// Add computed bonus and pay totals per shift for display
const shiftRows = computed(() =>
  shifts.value.map((shift) => {
    const bonusesTotal =
      (shift.bonusTravel || 0) + (shift.bonusManage || 0) + (shift.bonusSetup || 0) + (shift.bonusOther || 0)
    return {
      ...shift,
      bonusesTotal,
      payTotal: (shift.totalHours || 0) * (shift.hourly || 0) + bonusesTotal,
    }
  }),
)

const shiftHeaders: TableHeader<(typeof shiftRows.value)[number]>[] = [
  { key: 'role', label: 'תפקיד' },
  { key: 'timing', label: 'זמן' },
  { key: 'totalHours', label: 'שעות' },
  { key: 'hourly', label: 'תעריף' },
  { key: 'bonusesTotal', label: 'בונוסים' },
  { key: 'payTotal', label: 'לתשלום' },
  { key: 'approved', label: 'אושר' },
  { key: 'received', label: 'מעטפה' },
]
</script>
