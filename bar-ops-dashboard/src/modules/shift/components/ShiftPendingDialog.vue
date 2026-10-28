<template>
  <AppDialog v-model="isOpen" type="info" size="lg" title="בקשות משמרת" confirm-text="סגור">
    <!-- Min height keeps the dialog steady when a filter is empty -->
    <v-sheet min-height="240" color="transparent" class="d-flex flex-column ga-2">
      <!-- Status filter with counts -->
      <v-chip-group v-model="filter" mandatory column class="mb-1">
        <v-chip
          v-for="status in statuses"
          :key="status"
          :value="status"
          :color="ShiftRegistrationColors[status]"
          :variant="filter === status ? 'flat' : 'tonal'"
          size="small"
          class="font-weight-bold"
        >
          {{ ShiftRegistrationLabels[status] }} ({{ counts[status] }})
        </v-chip>
      </v-chip-group>

      <div v-if="visibleShifts.length === 0" class="text-body-2 text-medium-emphasis text-center py-6">
        אין משמרות בסטטוס זה
      </div>

      <div
        v-for="shift in visibleShifts"
        :key="shift.id"
        class="d-flex align-center ga-3 pa-3 border rounded-lg"
      >
        <div class="flex-grow-1 overflow-hidden">
          <div class="d-flex align-center flex-wrap ga-2">
            <span class="font-weight-bold">{{ employeeName(shift) }}</span>
            <v-chip
              v-if="employeeOf(shift)?.level"
              size="x-small"
              variant="tonal"
              :color="EmployeeLevelColors[employeeOf(shift)!.level!]"
              :prepend-icon="EmployeeLevelIcons[employeeOf(shift)!.level!]"
            >
              {{ EmployeeLevelLabels[employeeOf(shift)!.level!] }}
            </v-chip>
            <span v-else class="text-caption text-disabled">ללא דירוג</span>
            <v-chip size="x-small" variant="outlined">{{ ShiftRoleLabels[shift.role] }}</v-chip>
          </div>
          <div
            class="text-caption text-medium-emphasis text-truncate"
            :title="employeeOf(shift)?.workExperience"
          >
            {{ employeeOf(shift)?.workExperience || 'ללא ניסיון מפורט' }}
          </div>
        </div>

        <!-- Only the moves that change the status are offered -->
        <div class="d-flex ga-1 flex-shrink-0">
          <AppButton
            v-if="registrationOf(shift) !== ShiftRegistration.APPROVED"
            icon
            variant="text"
            color="success"
            size="small"
            :loading="loadingIds.has(shift.id)"
            aria-label="אשר"
            @click="emit('approve', shift)"
          >
            <v-icon size="26">mdi-check-circle</v-icon>
            <v-tooltip activator="parent" location="top" text="אשר" />
          </AppButton>
          <AppButton
            v-if="registrationOf(shift) !== ShiftRegistration.REJECTED"
            icon
            variant="text"
            color="error"
            size="small"
            :loading="loadingIds.has(shift.id)"
            aria-label="דחה"
            @click="emit('reject', shift)"
          >
            <v-icon size="26">mdi-close-circle</v-icon>
            <v-tooltip activator="parent" location="top" text="דחה" />
          </AppButton>
        </div>
      </div>
    </v-sheet>
  </AppDialog>
</template>

<script setup lang="ts">
// Registrations by status: review, approve or reject
import { computed, ref } from 'vue'

import { EmployeesStore } from '@stores'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import { ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import {
  ShiftRegistration,
  ShiftRegistrationColors,
  ShiftRegistrationLabels,
} from '@shift/types/ShiftRegistration.types'
import {
  EmployeeLevelColors,
  EmployeeLevelIcons,
  EmployeeLevelLabels,
} from '@employee/types/EmployeeLevel.types'
import type { IShift } from '@shift/types/IShift.types'

const props = defineProps<{
  modelValue: boolean
  shifts: IShift[]
  loadingIds: Set<string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  approve: [shift: IShift]
  reject: [shift: IShift]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const employeesStore = EmployeesStore()

const statuses = [ShiftRegistration.PENDING, ShiftRegistration.APPROVED, ShiftRegistration.REJECTED]
const filter = ref<ShiftRegistration>(ShiftRegistration.PENDING)

// Missing value = created before registrations existed, so approved
const registrationOf = (shift: IShift) => shift.registration ?? ShiftRegistration.APPROVED

const counts = computed(() => {
  const result: Record<ShiftRegistration, number> = {
    [ShiftRegistration.PENDING]: 0,
    [ShiftRegistration.APPROVED]: 0,
    [ShiftRegistration.REJECTED]: 0,
  }
  for (const shift of props.shifts) result[registrationOf(shift)]++
  return result
})

const visibleShifts = computed(() =>
  props.shifts.filter((shift) => registrationOf(shift) === filter.value),
)

const employeeOf = (shift: IShift) => employeesStore.get(shift.employeeId)

const employeeName = (shift: IShift) => {
  const emp = employeeOf(shift)
  return emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע'
}
</script>
