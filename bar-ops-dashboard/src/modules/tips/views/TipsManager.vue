<template>
  <v-col>
    <PageHeader
      :path="[]"
      title="ניהול טיפים"
      desc="חלוקת הטיפים לעובדים לפי שעות, בונוסים ותעריף שעתי"
      :min-role="UserRole.MANAGER"
    />

    <!-- Same side padding as the header -->
    <v-container class="py-0">
      <v-row dense class="mb-6">
        <v-col v-for="tip in tipsResource.data" :key="tip.id" cols="12" md="6">
          <TipsCard :tips="tip" @edit="TipsCrud.openUpdate" />
        </v-col>
      </v-row>

      <v-row dense class="mb-2">
        <v-col cols="12">
          <TipsSurplusCard
            :total-tips="totalTipsCollected"
            :workers-pay="totalPayDistributed"
            :expenses="totalTipsExpenses"
            :surplus="tipsSurplus"
          />
        </v-col>
      </v-row>

      <!-- Pay split title; hourly rates of these shifts are edited on their own page -->
      <div
        v-if="calculatedRoleGroups.length > 0"
        class="d-flex align-center justify-space-between mb-4"
      >
        <h2 class="text-h6 font-weight-bold mb-0">חלוקה לעובדים</h2>
        <auth-wrapper :level="UserRole.MANAGER">
          <AppButton
            variant="tonal"
            color="primary"
            rounded="pill"
            prepend-icon="mdi-clock-edit-outline"
            class="font-weight-bold"
            :to="{
              name: 'shift-hourly-rates',
              params: { clientId: route.params.clientId, id: route.params.id },
            }"
          >
            עדכון שעתי
          </AppButton>
        </auth-wrapper>
      </div>

      <!-- Per-role tables -->
      <div v-for="roleGroup in calculatedRoleGroups" :key="roleGroup.role" class="mb-6">
        <div class="text-subtitle-1 font-weight-bold mb-3">{{ roleGroup.title }}</div>

        <AppTable
          hover
          density="comfortable"
          :headers="tipsTableHeaders"
          :items="roleGroup.tableRows"
          :sticky-first-column="true"
          class="tips-table"
        >
          <template #fullName="{ value }">
            <span class="font-weight-medium">{{ value }}</span>
          </template>
          <template #totalHours="{ value }">
            <div class="text-center">{{ value }}</div>
          </template>
          <template #totalBonuses="{ value }">
            <div class="text-center text-success">
              <span v-if="(value as number) > 0">₪{{ value }}</span>
              <span v-else class="text-disabled">-</span>
            </div>
          </template>
          <template #hourlyRate="{ value }">
            <div class="text-center">
              <v-chip size="x-small" variant="outlined" color="grey-darken-1">
                ₪{{ (value as number).toFixed(2) }}
              </v-chip>
            </div>
          </template>
          <template #totalPay="{ value }">
            <div class="text-left">
              <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                ₪{{ (value as number).toFixed(2) }}
              </v-chip>
            </div>
          </template>
          <template #footer>
            <tr class="font-weight-black summary-row">
              <td class="text-right text-subtitle-2">סה"כ:</td>
              <td class="text-center">{{ roleGroup.summaryTotalHours }}</td>
              <td class="text-center text-success">
                <span v-if="roleGroup.summaryTotalBonuses > 0"
                  >₪{{ roleGroup.summaryTotalBonuses }}</span
                >
                <span v-else class="text-disabled">-</span>
              </td>
              <td class="text-center text-disabled">-</td>
              <td class="text-left text-primary text-subtitle-1">
                ₪{{ roleGroup.summaryTotalPay.toFixed(2) }}
              </td>
            </tr>
          </template>
        </AppTable>
      </div>
    </v-container>

    <AppDialog v-model="TipsCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="TipsCrud.selectedItem.value"
        title="עריכת טיפים"
        submit-text="עדכן טיפים"
        :loading="TipsCrud.isUpdating.value"
        :fields="TipsCrud.tipsFields"
        :initial-values="TipsCrud.selectedItem.value"
        show-cancel
        @submit="TipsCrud.handleUpdate"
        @cancel="TipsCrud.updateDialogOpen.value = false"
      />
    </AppDialog>
  </v-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Import stores and composables
import { SessionStore, EmployeesStore } from '@stores'
import { useTipsCrud } from '@tips/composables/tips.crud'
import { addVat } from '@shared/utils/vat.util'

// Import custom components
import TipsCard from '@tips/components/TipsCard.vue'
import TipsSurplusCard from '@tips/components/TipsSurplusCard.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppTable from '@shared/components/data/AppTable.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'

// Import types
import { ServiceArea } from '@tips/types/ServiceArea.types'
import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import { ExpensePaidBy } from '@expense/types/PaidBy.types'
import { UserRole } from '@auth/types/IUser.types'

interface IRawData {
  id: string
  fullName: string
  totalHours: number
  totalBonuses: number
  hourlyRate: number
  totalPay: number
}

interface IRoleGroup {
  role: ShiftRole
  title: string
  tableRows: IRawData[]
  summaryTotalHours: number
  summaryTotalBonuses: number
  summaryTotalPay: number
}

const route = useRoute()
const sessionStore = SessionStore()
const employStore = EmployeesStore()

const tipsResource = sessionStore.tips

const TipsCrud = useTipsCrud()

const tipsTableHeaders = [
  {
    key: 'fullName',
    label: 'שם עובד',
    align: 'right' as const,
  },
  {
    key: 'totalHours',
    label: 'שעות',
    align: 'center' as const,
  },
  {
    key: 'totalBonuses',
    label: 'בונוסים',
    align: 'center' as const,
  },
  {
    key: 'hourlyRate',
    label: 'שעתי',
    align: 'center' as const,
  },
  {
    key: 'totalPay',
    label: 'סה"כ לתשלום',
    align: 'left' as const,
  },
]

// Define the display order of roles
const ROLE_ORDER: ShiftRole[] = [
  ShiftRole.BAR_MANAGER,
  ShiftRole.BARTENDER,
  ShiftRole.WAITER_MANAGER,
  ShiftRole.WAITER,
  ShiftRole.RUNNER,
]

// Maps each role to which tips area it belongs
const ROLE_TO_AREA: Record<ShiftRole, ServiceArea> = {
  [ShiftRole.BARTENDER]: ServiceArea.BAR,
  [ShiftRole.BAR_MANAGER]: ServiceArea.BAR,
  [ShiftRole.WAITER]: ServiceArea.TABLES,
  [ShiftRole.WAITER_MANAGER]: ServiceArea.TABLES,
  [ShiftRole.RUNNER]: ServiceArea.TABLES,
}

// Pre-compute hourly rates per area from the tips config
const areaRates = computed<Record<ServiceArea, { hourlyRate: number; runnerRate: number }>>(() => {
  const tipsList = tipsResource.data || []
  const allShifts = sessionStore.registeredShifts

  const result = {} as Record<ServiceArea, { hourlyRate: number; runnerRate: number }>

  for (const tips of tipsList) {
    const areaShifts = allShifts.filter((shift) => {
      if (tips.area === ServiceArea.BAR) {
        return shift.role === ShiftRole.BARTENDER || shift.role === ShiftRole.BAR_MANAGER
      }
      if (tips.area === ServiceArea.TABLES) {
        return (
          shift.role === ShiftRole.WAITER ||
          shift.role === ShiftRole.WAITER_MANAGER ||
          shift.role === ShiftRole.RUNNER
        )
      }
      return false
    })

    const totalTips = (tips.creditTip || 0) + (tips.cashTip || 0)
    const totalBonuses = areaShifts.reduce(
      (acc, s) =>
        acc +
        (s.bonusTravel || 0) +
        (s.bonusManage || 0) +
        (s.bonusSetup || 0) +
        (s.bonusOther || 0),
      0,
    )

    // Separate shifts with custom hourly rate
    const fixedHourlyShifts = areaShifts.filter(
      (s) => s.hourly !== undefined && s.hourly !== null && s.hourly > 0,
    )
    const poolShifts = areaShifts.filter(
      (s) => !(s.hourly !== undefined && s.hourly !== null && s.hourly > 0),
    )

    const fixedHourlyCost = fixedHourlyShifts.reduce(
      (acc, s) => acc + (s.totalHours || 0) * (s.hourly || 0),
      0,
    )

    const runnerShifts = poolShifts.filter((s) => s.role === ShiftRole.RUNNER)
    const otherShifts = poolShifts.filter((s) => s.role !== ShiftRole.RUNNER)

    const runnerTotalHours = runnerShifts.reduce((acc, s) => acc + (s.totalHours || 0), 0)
    const otherTotalHours = otherShifts.reduce((acc, s) => acc + (s.totalHours || 0), 0)

    const runnersCost = runnerTotalHours * (tips.runnerFeed || 0)
    const leftForOthers = totalTips - totalBonuses - runnersCost - fixedHourlyCost
    const hourlyRate = otherTotalHours > 0 ? leftForOthers / otherTotalHours : 0

    result[tips.area] = {
      hourlyRate,
      runnerRate: tips.runnerFeed || 0,
    }
  }

  return result
})

// Group all shifts by ShiftRole, one table per role
const calculatedRoleGroups = computed<IRoleGroup[]>(() => {
  const allShifts = sessionStore.registeredShifts
  const rates = areaRates.value

  return ROLE_ORDER.reduce<IRoleGroup[]>((groups, role) => {
    const roleShifts = allShifts.filter((s) => s.role === role)
    if (roleShifts.length === 0) return groups

    const area = ROLE_TO_AREA[role]
    const areaRate = rates[area]
    const isRunner = role === ShiftRole.RUNNER
    const rate = areaRate ? (isRunner ? areaRate.runnerRate : areaRate.hourlyRate) : 0

    const tableRows: IRawData[] = roleShifts.map((shift) => {
      const employee = employStore.get(shift.employeeId)
      const rowBonuses =
        (shift.bonusTravel || 0) +
        (shift.bonusManage || 0) +
        (shift.bonusSetup || 0) +
        (shift.bonusOther || 0)

      // Use custom shift hourly rate if defined, otherwise fallback to calculated rate
      const shiftRate =
        shift.hourly !== undefined && shift.hourly !== null && shift.hourly > 0
          ? shift.hourly
          : rate

      return {
        id: shift.id,
        fullName: employee ? `${employee.firstName} ${employee.lastName}` : 'עובד לא ידוע',
        totalHours: Number((shift.totalHours || 0).toFixed(2)),
        totalBonuses: rowBonuses,
        hourlyRate: shiftRate,
        totalPay: (shift.totalHours || 0) * shiftRate + rowBonuses,
      }
    })

    const summaryTotalHours = Number(
      tableRows.reduce((acc, row) => acc + row.totalHours, 0).toFixed(2),
    )
    const summaryTotalBonuses = tableRows.reduce((acc, row) => acc + row.totalBonuses, 0)
    const summaryTotalPay = tableRows.reduce((acc, row) => acc + row.totalPay, 0)

    groups.push({
      role,
      title: ShiftRoleLabels[role],
      tableRows,
      summaryTotalHours,
      summaryTotalBonuses,
      summaryTotalPay,
    })

    return groups
  }, [])
})

// Calculate tip surplus
const totalTipsCollected = computed(() => {
  const tipsList = tipsResource.data || []
  return tipsList.reduce((sum, t) => sum + (t.cashTip || 0) + (t.creditTip || 0), 0)
})

const totalPayDistributed = computed(() => {
  return calculatedRoleGroups.value.reduce((sum, group) => sum + group.summaryTotalPay, 0)
})

const totalTipsExpenses = computed(() => {
  const expenseList = sessionStore.expenses?.data || []
  const netSum = expenseList
    .filter((e) => e.paidBy === ExpensePaidBy.TIPS)
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  return addVat(netSum)
})

const tipsSurplus = computed(() => {
  const surplus = totalTipsCollected.value - totalPayDistributed.value - totalTipsExpenses.value
  return Math.max(0, Number(surplus.toFixed(2)))
})
</script>

<style scoped>
.tips-table :deep(th) {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.05rem;
}
.summary-row {
  border-top: 2px solid rgba(var(--v-border-color), 0.15) !important;
  background-color: rgba(var(--v-theme-surface-variant), 0.05);
}
</style>
