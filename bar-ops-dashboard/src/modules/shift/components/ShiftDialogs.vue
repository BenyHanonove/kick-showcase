<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <GenericForm
      title="יצירת משמרת חדשה"
      submit-text="צור משמרת"
      :loading="props.ShiftCrud.isCreating.value"
      :fields="props.ShiftCrud.shiftFields.value"
      :initial-values="createInitialValues"
      show-reset
      @submit="(form) => props.ShiftCrud.handleCreate(form as ICreateShift)"
    >
      <template #employeeId="{ field, form }">
        <v-autocomplete
          v-model="form.employeeId"
          label="עובד*"
          :items="availableEmployees"
          :item-title="getEmployeeFullName"
          item-value="id"
          variant="outlined"
          density="comfortable"
          :rules="field.rules"
          autocomplete="disabled"
        />
      </template>

      <template #bonusTravel="{ form }">
        <ShiftBonusInputs :form="form" />
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.ShiftCrud.selectedItem.value"
      title="עריכת משמרת"
      submit-text="עדכן משמרת"
      :loading="props.ShiftCrud.isUpdating.value"
      :fields="props.ShiftCrud.shiftUpdateFields.value"
      :initial-values="props.ShiftCrud.shiftUpdateInitial.value"
      show-cancel
      @submit="(form) => props.ShiftCrud.handleUpdate(form as IUpdateShift)"
      @cancel="updateOpen = false"
    >
      <template #employeeId="{ field, form }">
        <v-autocomplete
          v-model="form.employeeId"
          label="עובד*"
          :items="availableEmployees"
          :item-title="getEmployeeFullName"
          item-value="id"
          variant="outlined"
          density="comfortable"
          :rules="field.rules"
          autocomplete="disabled"
        />
      </template>

      <template #bonusTravel="{ form }">
        <ShiftBonusInputs :form="form" />
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Delete Dialog -->
  <AppDialog
    v-model="deleteOpen"
    type="delete"
    title="מחיקת משמרת"
    :item-name="deleteItemName"
    :loading="props.ShiftCrud.isDeleting.value"
    @confirm="props.ShiftCrud.handleDelete"
    @cancel="deleteOpen = false"
  />

  <!-- Interval List Dialog (module-specific, outside the CRUD triad) -->
  <AppDialog v-model="intervalDialogOpen" type="raw" size="lg">
    <interval-list v-if="intervalShift" :shift-id="intervalShift.id" :session-id="props.sessionId" />
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Import stores and utilities
import { SessionStore, EmployeesStore } from '@stores'
import { useFormatter } from '@shared/composables/useFormatter.composable'
import type { IEmployee } from '@employee/types/IEmployee.types'
import type { IShift, ICreateShift, IUpdateShift } from '@shift/types/IShift.types'
import { useShiftCrud } from '@shift/composables/shift.crud'

// Import components
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import ShiftBonusInputs from '@shift/components/ShiftBonusInputs.vue'
import IntervalList from '@interval/views/IntervalManger.vue'

const props = defineProps<{
  ShiftCrud: ReturnType<typeof useShiftCrud>
  sessionId: string
}>()

// Model bindings
const intervalDialogOpen = defineModel<boolean>('intervalDialogOpen', { default: false })
const intervalShift = defineModel<IShift | null>('intervalShift', { default: null })

const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })

const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

const shifts = computed(() => sessionStore.shifts?.data || [])
const assignedEmployeeIds = computed(() => shifts.value.map((s) => s.employeeId))

const availableEmployees = computed(() => {
  const all = employeesStore.employees || []
  return all.filter((e) => !assignedEmployeeIds.value.includes(e.id))
})

// Stable initial values so GenericForm's watcher doesn't reset the form
const createInitialValues = computed(() => ({
  ...props.ShiftCrud.shiftInitialState,
  sessionId: props.sessionId,
}))

const getEmployeeFullName = (item: unknown): string => {
  if (!item) return ''
  const emp = item as IEmployee
  return `${emp.firstName} ${emp.lastName}`
}

const deleteItemName = computed(() => {
  const shift = props.ShiftCrud.selectedItem.value
  return shift ? `משמרת של ${useFormatter().formatShiftTiming(shift.timing)}` : ''
})
</script>
