<template>
  <v-card
    variant="flat"
    :ripple="false"
    class="rounded-lg mb-3 bg-card shadow-sm cursor-pointer"
    @click="toggleExpand"
  >
    <div class="d-flex flex-column pa-4 ga-3">
      <!-- First Row: Avatar + Name on start, Dropdown menu on end -->
      <div class="d-flex align-center justify-space-between w-100">
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal" size="40">
            <v-icon color="primary">mdi-car-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ displayName }}
            </div>
            <div
              v-if="vehicle.licensePlate"
              class="text-caption text-medium-emphasis d-flex align-center ga-1"
            >
              <v-icon size="14">mdi-license-plate</v-icon>
              <span>{{ vehicle.licensePlate }}</span>
            </div>
          </div>
        </div>

        <!-- Actions Menu -->
        <div>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <AppButton
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                color="medium-emphasis"
                v-bind="menuProps"
                @click.stop
              />
            </template>
            <AppList :actions="menuActions" />
          </v-menu>
        </div>
      </div>

      <!-- Second Row: Additional Info (Sum, Passengers) -->
      <div class="d-flex align-center justify-space-between text-body-2 flex-wrap ps-13">
        <div class="d-flex align-center ga-1">
          <span class="text-medium-emphasis">סכום:</span>
          <span class="font-weight-medium">₪{{ vehicle.sum }}</span>
        </div>
        <div class="d-flex align-center ga-1">
          <v-chip size="small" color="primary" variant="tonal" prepend-icon="mdi-account-group">
            {{ vehicle.passengerShiftIds ? vehicle.passengerShiftIds.length : 0 }} נוסעים
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Expanded content -->
    <div v-if="isExpanded" class="px-4 pb-4 pt-2" @click.stop>
      <!-- Driver Info Section -->
      <div class="mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">נהג</div>
        <v-card v-if="driverInfo" variant="outlined" class="driver-card rounded-lg pa-3 bg-driver">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center ga-3">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon color="primary">mdi-steering</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-bold">
                  {{ driverInfo.fullName }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  <span>{{ driverInfo.empType }}</span>
                  <span v-if="driverInfo.empType && driverInfo.shiftRole" class="mx-1">•</span>
                  <span>{{ driverInfo.shiftRole }}</span>
                </div>
              </div>
            </div>

            <div v-if="driverInfo.phone">
              <AppButton
                variant="outlined"
                color="primary"
                size="small"
                prepend-icon="mdi-phone"
                :href="`tel:${driverInfo.phone}`"
                @click.stop
                class="rounded-lg font-weight-bold"
              >
                {{ driverInfo.phone }}
              </AppButton>
            </div>
            <div v-else class="text-caption text-medium-emphasis italic">ללא מספר טלפון</div>
          </div>
        </v-card>

        <v-card
          v-else
          variant="outlined"
          class="driver-card border-dashed rounded-lg pa-4 text-center"
        >
          <div class="d-flex align-center justify-center ga-2 text-medium-emphasis text-body-2">
            <v-icon>mdi-steering-off</v-icon>
            <span>לא שויך נהג להסעה זו</span>
          </div>
        </v-card>
      </div>

      <div class="text-subtitle-2 font-weight-bold mb-3 mt-1 text-primary">נוסעים בהסעה</div>
      <div v-if="passengerItems.length > 0" class="d-flex flex-column ga-2">
        <v-card
          v-for="passenger in passengerItems"
          :key="passenger.id"
          variant="outlined"
          class="driver-card rounded-lg pa-3 bg-passenger"
        >
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center ga-3">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon color="primary">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-bold">
                  {{ passenger.fullName }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  <span>{{ passenger.empType }}</span>
                  <span v-if="passenger.empType && passenger.shiftRole" class="mx-1">•</span>
                  <span>{{ passenger.shiftRole }}</span>
                </div>
              </div>
            </div>

            <div v-if="passenger.phone">
              <AppButton
                variant="outlined"
                color="primary"
                size="small"
                prepend-icon="mdi-phone"
                :href="`tel:${passenger.phone}`"
                @click.stop
                class="rounded-lg font-weight-bold"
              >
                {{ passenger.phone }}
              </AppButton>
            </div>
            <div v-else class="text-caption text-medium-emphasis italic">ללא מספר טלפון</div>
          </div>
        </v-card>
      </div>

      <v-card
        v-else
        variant="outlined"
        class="driver-card border-dashed rounded-lg pa-4 text-center"
      >
        <div class="d-flex align-center justify-center ga-2 text-medium-emphasis text-body-2">
          <v-icon>mdi-account-off</v-icon>
          <span>לא שויכו נוסעים להסעה זו</span>
        </div>
      </v-card>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { SessionStore, EmployeesStore, AuthStore } from '@stores'

import type { IVehicle } from '@vehicle/types/IVehicle.types'
import { ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import { EmployeeTypeLabels } from '@employee/types/EmployeeType.types'
import type { IListAction } from '@shared/types/IListAction.types'

const props = defineProps<{
  vehicle: IVehicle
}>()

const emit = defineEmits<{
  (e: 'edit', vehicle: IVehicle): void
  (e: 'delete', vehicle: IVehicle): void
}>()

const sessionStore = SessionStore()
const employeesStore = EmployeesStore()
const authStore = AuthStore()

// Menu actions — managers and up only, destructive actions in their own group
const menuActions = computed<IListAction[][]>(() => {
  if (!authStore.isManager) return []
  return [
    [{ title: 'עדכן', icon: 'mdi-pencil', handler: () => emit('edit', props.vehicle) }],
    [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', props.vehicle) }],
  ]
})

const isExpanded = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// Compute driver/vehicle display name
const displayName = computed(() => {
  if (props.vehicle.desc) {
    return `רכב ${props.vehicle.desc}`
  }
  if (props.vehicle.driverShiftId) {
    const shift = (sessionStore.shifts.data || []).find((s) => s.id === props.vehicle.driverShiftId)
    if (shift) {
      const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
      if (emp) {
        return `רכב ${emp.firstName} ${emp.lastName}`
      }
    }
  }
  return 'רכב ללא נהג'
})

// Compute driver information details
const driverInfo = computed(() => {
  if (!props.vehicle.driverShiftId) return null
  const shift = (sessionStore.shifts.data || []).find((s) => s.id === props.vehicle.driverShiftId)
  if (!shift) return null
  const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
  if (!emp) return null
  return {
    id: shift.id,
    fullName: `${emp.firstName} ${emp.lastName}`,
    phone: emp.phone,
    shiftRole: ShiftRoleLabels[shift.role] || shift.role,
    empType: emp.type ? EmployeeTypeLabels[emp.type] : '',
  }
})

const passengerItems = computed(() => {
  const passengers = props.vehicle.passengerShiftIds || []
  return passengers
    .map((shiftId) => {
      const shift = (sessionStore.shifts.data || []).find((s) => s.id === shiftId)
      if (!shift) return null
      const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
      if (!emp) return null
      return {
        id: shiftId,
        fullName: `${emp.firstName} ${emp.lastName}`,
        phone: emp.phone,
        shiftRole: ShiftRoleLabels[shift.role] || shift.role,
        empType: emp.type ? EmployeeTypeLabels[emp.type] : '',
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.v-card {
  border: none !important;
  transition: none !important;
  animation: none !important;
}

.driver-card {
  border: 1px solid rgba(var(--v-theme-primary), 0.15) !important;
}

.driver-card.border-dashed {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15) !important;
}

.bg-driver {
  background: rgba(var(--v-theme-primary), 0.02) !important;
}

.bg-passenger {
  background: rgba(var(--v-theme-on-surface), 0.01) !important;
}

:deep(.v-card__overlay) {
  display: none !important;
}
</style>
