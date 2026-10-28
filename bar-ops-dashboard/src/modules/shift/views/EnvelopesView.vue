<template>
  <v-col>
    <PageHeader
      :path="[]"
      title="מעטפות"
      desc="מעקב וקבלת מעטפות שכר עבור עובדי האירוע"
      :min-role="UserRole.MANAGER"
    />

    <!-- Same side padding as the header -->
    <v-container class="py-0">
      <!-- Envelopes Collapsible Summary -->
      <envelopes-summary
        :total="totalEnvelopes"
        :received="totalReceived"
        :pending="totalPending"
      />

      <!-- Filters only when there is something to filter; container matches the rows width -->
      <v-container v-if="totalEnvelopes > 0" class="pa-0">
        <!-- Filter Chips -->
        <v-chip-group v-model="activeStatus" mandatory variant="tonal" class="mb-4">
          <v-chip value="all" filter size="small" class="font-weight-bold" color="grey-darken-3">
            הכל ({{ totalEnvelopes }})
          </v-chip>
          <v-chip value="received" filter size="small" class="font-weight-bold" color="success">
            <v-icon icon="mdi-check-circle" start size="16" class="me-1" />
            התקבלו ({{ totalReceived }})
          </v-chip>
          <v-chip value="pending" filter size="small" class="font-weight-bold" color="warning">
            <v-icon icon="mdi-checkbox-blank-circle-outline" start size="16" class="me-1" />
            ממתין ({{ totalPending }})
          </v-chip>
        </v-chip-group>

        <!-- Search Bar -->
        <search-bar v-model="searchQuery" label="חפש לפי שם עובד..." class="mb-4" />
      </v-container>

      <!-- Empty State -->
      <v-container v-if="envelopes.length === 0" class="px-0">
        <EmptyState v-if="totalEnvelopes === 0" icon="mdi-email-outline" feature="מעטפות" />
        <EmptyState v-else icon="mdi-account-search-outline" feature="מעטפות תואמות" />
      </v-container>

      <!-- List of Envelope Rows -->
      <v-container v-else class="px-0">
        <v-row dense>
          <v-col v-for="env in envelopes" :key="env.id" cols="12">
            <envelope-row
              :shift="env.shift"
              :employee-name="env.employeeName"
              :price="env.price"
              :loading="togglingIds.has(env.shift.id)"
              @toggle-received="toggleReceived"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </v-col>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { SessionStore, EmployeesStore } from '@stores'
import { useShiftCrud } from '@shift/composables/shift.crud'

import { UserRole } from '@auth/types/IUser.types'
import { ShiftRole } from '@shift/types/ShiftRole.types'
import { ServiceArea } from '@tips/types/ServiceArea.types'
import type { IShift } from '@shift/types/IShift.types'

import EnvelopesSummary from '@shift/components/EnvelopesSummary.vue'
import EnvelopeRow from '@shift/components/EnvelopeRow.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import SearchBar from '@shared/components/forms/SearchBar.vue'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:loading', val: boolean): void
}>()

const sessionStore = SessionStore()
const employStore = EmployeesStore()

const searchQuery = ref('')
const activeStatus = ref<'all' | 'received' | 'pending'>('all')
const togglingIds = ref(new Set<string>())

// CRUD initialization
const ShiftCrud = useShiftCrud(sessionStore.shifts)

// Shifts list for this session
const shifts = computed(() => sessionStore.registeredShifts)

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
  const tipsList = sessionStore.tips.data || []
  const allShifts = shifts.value

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

// Calculate total pay/price for a shift
const getShiftPay = (shift: IShift) => {
  const area = ROLE_TO_AREA[shift.role]
  const areaRate = areaRates.value[area]
  const isRunner = shift.role === ShiftRole.RUNNER
  const rate = areaRate ? (isRunner ? areaRate.runnerRate : areaRate.hourlyRate) : 0

  const rowBonuses =
    (shift.bonusTravel || 0) +
    (shift.bonusManage || 0) +
    (shift.bonusSetup || 0) +
    (shift.bonusOther || 0)

  const shiftRate =
    shift.hourly !== undefined && shift.hourly !== null && shift.hourly > 0 ? shift.hourly : rate

  return (shift.totalHours || 0) * shiftRate + rowBonuses
}

// Formatted list of envelopes with computed prices
const envelopes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  let filtered = shifts.value

  // Status Filter
  if (activeStatus.value === 'received') {
    filtered = filtered.filter((s) => s.received)
  } else if (activeStatus.value === 'pending') {
    filtered = filtered.filter((s) => !s.received)
  }

  // Search Filter
  if (q) {
    filtered = filtered.filter((shift) => {
      const employee = employStore.get(shift.employeeId)
      if (!employee) return false
      return `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(q)
    })
  }

  return filtered.map((shift) => {
    const employee = employStore.get(shift.employeeId)
    const name = employee ? `${employee.firstName} ${employee.lastName}` : 'עובד לא ידוע'
    const price = getShiftPay(shift)
    return {
      shift,
      id: shift.id,
      employeeName: name,
      price,
      received: shift.received,
    }
  })
})

// Quick Summary Metrics
const totalEnvelopes = computed(() => shifts.value.length)
const totalReceived = computed(() => shifts.value.filter((s) => s.received).length)
const totalPending = computed(() => totalEnvelopes.value - totalReceived.value)

// Toggle function
const toggleReceived = async (shift: IShift) => {
  if (togglingIds.value.has(shift.id)) return
  togglingIds.value.add(shift.id)
  emit('update:loading', true)
  try {
    await ShiftCrud.toggleReceived(shift)
  } finally {
    togglingIds.value.delete(shift.id)
    emit('update:loading', false)
  }
}
</script>
