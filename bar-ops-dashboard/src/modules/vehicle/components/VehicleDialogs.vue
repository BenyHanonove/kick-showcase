<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <GenericForm
      title="יצירת רכב חדש"
      submit-text="צור רכב"
      :loading="props.vehicleCrud.isCreating.value"
      :fields="formFields"
      :initial-values="createInitialValues"
      show-reset
      @submit="handleCreateSubmit"
      @update:form="(f) => (createFormDriverShiftId = (f as ICreateVehicle).driverShiftId)"
    >
      <template #driverShiftId="{ form }">
        <v-autocomplete
          v-model="form.driverShiftId"
          label="נהג (מתוך משמרות האירוע)"
          :items="availableShifts"
          item-title="title"
          item-value="value"
          clearable
          variant="outlined"
          density="comfortable"
        />
      </template>

      <template #passengerShiftIds="{ form }">
        <AppListSelect
          :model-value="(form.passengerShiftIds as string[])"
          @update:model-value="(v) => (form.passengerShiftIds = v as string[])"
          :items="availablePassengerShiftsForCreate"
          multiple
          label="שיוך נוסעים"
          placeholder="חפש עובד לפי שם..."
          height="240px"
        />
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.vehicleCrud.selectedItem.value"
      title="עריכת פרטי רכב"
      submit-text="עדכן רכב"
      :loading="props.vehicleCrud.isUpdating.value"
      :fields="formFields"
      :initial-values="props.vehicleCrud.selectedItem.value"
      show-cancel
      @submit="handleUpdateSubmit"
      @cancel="updateOpen = false"
      @update:form="(f) => (updateFormDriverShiftId = (f as IUpdateVehicle).driverShiftId)"
    >
      <template #driverShiftId="{ form }">
        <v-autocomplete
          v-model="form.driverShiftId"
          label="נהג (מתוך משמרות האירוע)"
          :items="availableShifts"
          item-title="title"
          item-value="value"
          clearable
          variant="outlined"
          density="comfortable"
        />
      </template>

      <template #passengerShiftIds="{ form }">
        <AppListSelect
          :model-value="(form.passengerShiftIds as string[])"
          @update:model-value="(v) => (form.passengerShiftIds = v as string[])"
          :items="availablePassengerShiftsForUpdate"
          multiple
          label="שיוך נוסעים"
          placeholder="חפש עובד לפי שם..."
          height="240px"
        />
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Delete Dialog -->
  <AppDialog
    v-model="deleteOpen"
    type="delete"
    title="מחיקת רכב"
    :item-name="deleteItemName"
    :loading="props.vehicleCrud.isDeleting.value"
    @confirm="props.vehicleCrud.handleDelete"
    @cancel="deleteOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { SessionStore, EmployeesStore } from '@stores'

import { ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import type { ICreateVehicle, IUpdateVehicle } from '@vehicle/types/IVehicle.types'
import type { IFormField } from '@shared/types/IForm.types'
import { useVehicleCrud } from '@vehicle/composables/vehicle.crud'

import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppListSelect from '@shared/components/input/AppListSelect.vue'

const props = defineProps<{
  vehicleCrud: ReturnType<typeof useVehicleCrud>
  sessionId: string
}>()

const { vehicleCrud } = props

// Model bindings
const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })

// Track each form's picked driver to exclude from passenger candidates
const createFormDriverShiftId = ref<string | undefined>(undefined)
const updateFormDriverShiftId = ref<string | undefined>(undefined)

// Stable initial values so GenericForm doesn't reset on re-render
const createInitialValues = computed(() => ({
  ...vehicleCrud.vehicleInitialState(props.sessionId),
  passengerShiftIds: [] as string[],
}))

// Passenger selector appended to both forms; each dialog slot picks candidates
const formFields = computed<IFormField[]>(() => [
  ...vehicleCrud.vehicleFields,
  { key: 'passengerShiftIds', label: 'שיוך נוסעים', type: 'list-select', cols: 12 },
])

const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

const vehicles = computed(() => sessionStore.vehicles?.data || [])

// Compute options for dropdown menus based on active session shifts
const availableShifts = computed(() => {
  const shiftsList = sessionStore.registeredShifts
  return shiftsList.map((shift) => {
    const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע'
    return {
      title: `${empName} (${ShiftRoleLabels[shift.role] || shift.role})`,
      value: shift.id,
    }
  })
})

// Update flow: exclude other drivers/passengers, keep this vehicle's own
const availablePassengerShiftsForUpdate = computed(() => {
  const current = vehicleCrud.selectedItem.value
  if (!current) return []
  const allShifts = sessionStore.registeredShifts
  const allVehicles = vehicles.value
  const currentVehicleId = current.id

  const driverShiftIds = new Set(
    allVehicles.map((v) => v.driverShiftId).filter((id): id is string => !!id),
  )
  const passengerShiftIdsInOtherVehicles = new Set(
    allVehicles.filter((v) => v.id !== currentVehicleId).flatMap((v) => v.passengerShiftIds || []),
  )

  return allShifts
    .filter((shift) => {
      if (shift.id === updateFormDriverShiftId.value) return false
      if (driverShiftIds.has(shift.id)) return false
      if (passengerShiftIdsInOtherVehicles.has(shift.id)) return false
      return true
    })
    .map((shift) => {
      const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע'
      return { title: empName, value: shift.id }
    })
})

// Create flow: exclude shifts already a driver or passenger elsewhere
const availablePassengerShiftsForCreate = computed(() => {
  const allShifts = sessionStore.registeredShifts
  const allVehicles = vehicles.value

  const driverShiftIds = new Set(
    allVehicles.map((v) => v.driverShiftId).filter((id): id is string => !!id),
  )
  const passengerShiftIdsInVehicles = new Set(
    allVehicles.flatMap((v) => v.passengerShiftIds || []),
  )

  return allShifts
    .filter((shift) => {
      if (shift.id === createFormDriverShiftId.value) return false
      if (driverShiftIds.has(shift.id)) return false
      if (passengerShiftIdsInVehicles.has(shift.id)) return false
      return true
    })
    .map((shift) => {
      const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע'
      return { title: empName, value: shift.id }
    })
})

// Submission handlers
const handleCreateSubmit = async (formData: unknown) => {
  // Create endpoint rejects passengerShiftIds; assign via update instead
  const { passengerShiftIds = [], ...createData } = formData as ICreateVehicle & {
    passengerShiftIds?: string[]
  }

  // A shift can't be both the driver and a passenger of the same vehicle.
  const passengers = passengerShiftIds.filter((id) => id !== createData.driverShiftId)

  const created = await vehicleCrud.handleCreate(createData as ICreateVehicle)
  if (created && passengers.length > 0) {
    vehicleCrud.selectedItem.value = created
    await vehicleCrud.handleUpdate({ passengerShiftIds: passengers } as IUpdateVehicle)
  }
  createFormDriverShiftId.value = undefined
}

const handleUpdateSubmit = (formData: unknown) => {
  const data = formData as IUpdateVehicle & { passengerShiftIds?: string[] }
  // A shift can't be both the driver and a passenger of the same vehicle.
  if (data.passengerShiftIds && data.driverShiftId) {
    data.passengerShiftIds = data.passengerShiftIds.filter((id) => id !== data.driverShiftId)
  }
  vehicleCrud.handleUpdate(data as IUpdateVehicle)
  updateFormDriverShiftId.value = undefined
}

// Compute names
const deleteItemName = computed(() => {
  const vehicle = vehicleCrud.selectedItem.value
  if (!vehicle) return ''
  if (vehicle.desc) return vehicle.desc
  if (vehicle.driverShiftId) {
    const shift = sessionStore.shifts?.data?.find((s) => s.id === vehicle.driverShiftId)
    if (shift) {
      const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
      if (emp) return `הרכב של ${emp.firstName} ${emp.lastName}`
    }
  }
  return 'רכב'
})
</script>
