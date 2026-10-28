<template>
  <v-container class="pa-0 mb-6">
    <!-- Header Toggle Card -->
    <v-card
      variant="flat"
      class="toggle-header rounded-xl border pa-3 d-flex align-center justify-space-between shadow-sm mb-2"
      @click="isOpen = !isOpen"
    >
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-car-multiple" color="primary" />
        <span class="text-subtitle-1 font-weight-bold">סיכום הסעות סשן</span>
        <!-- Small Alert Icon when closed -->
        <v-icon
          v-if="!isOpen && unassignedEmployees.length > 0"
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
          <span>
            רכבים: <strong class="text-primary text-body-2">{{ totalVehicles }}</strong>
          </span>
          <v-divider vertical class="mx-1" />
          <span>
            סה"כ נוסעים: <span class="text-info font-weight-bold">{{ totalPassengers }}</span>
          </span>
          <v-divider vertical class="mx-1" />
          <span>
            עובדים ללא הסעה:
            <span
              :class="
                unassignedEmployees.length > 0
                  ? 'text-error font-weight-bold'
                  : 'text-success font-weight-bold'
              "
            >
              {{ unassignedEmployees.length }}
            </span>
          </span>
        </div>
      </v-expand-x-transition>
    </v-card>

    <!-- Collapsible Summary Content -->
    <v-expand-transition>
      <div
        v-show="isOpen"
        class="summary-body rounded-xl border pa-4 bg-summary-body mb-2 shadow-sm"
      >
        <!-- Alerts for employees without transportation -->
        <v-card
          v-if="unassignedEmployees.length > 0"
          variant="flat"
          class="mb-4 rounded-xl border-error-subtle pa-4"
        >
          <div class="d-flex align-center ga-2 font-weight-bold mb-3">
            <v-icon icon="mdi-alert-circle" color="error" />
            <span class="text-subtitle-1"
              >עובדים ללא סידור הסעה ({{ unassignedEmployees.length }})</span
            >
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="emp in unassignedEmployees"
              :key="emp.id"
              color="error"
              variant="tonal"
              prepend-icon="mdi-account-alert"
              class="font-weight-medium"
            >
              {{ emp.fullName }} ({{ emp.role }})
            </v-chip>
          </div>
        </v-card>
        <v-card
          v-else
          variant="flat"
          class="mb-4 rounded-xl border-success-subtle pa-4 bg-success-container"
        >
          <div class="d-flex align-center ga-2 font-weight-bold text-success text-subtitle-1">
            <v-icon icon="mdi-check-circle" color="success" />
            <span>לכל העובדים המשובצים יש סידור הסעה!</span>
          </div>
        </v-card>

        <!-- Metric Grid -->
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-car" color="primary" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">רכבים פעילים</div>
              <div class="text-h5 font-weight-black text-primary mt-1">
                {{ totalVehicles }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-account-multiple" color="info" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">נוסעים משויכים</div>
              <div class="text-h5 font-weight-black text-info mt-1">
                {{ totalPassengers }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="flat" class="metric-card pa-3 rounded-xl text-center h-100">
              <v-icon icon="mdi-cash" color="success" class="mb-1 text-h5" />
              <div class="text-caption text-medium-emphasis">עלות הסעות כוללת</div>
              <div class="text-h5 font-weight-black text-success mt-1">₪{{ totalCost }}</div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Import stores
import { SessionStore, EmployeesStore } from '@stores'

// Import types
import { ShiftRoleLabels } from '@shift/types/ShiftRole.types'

const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

const isOpen = ref(false)

const vehicles = computed(() => sessionStore.vehicles?.data || [])
const shifts = computed(() => sessionStore.registeredShifts)

const totalVehicles = computed(() => vehicles.value.length)

const totalPassengers = computed(() => {
  return vehicles.value.reduce((acc, v) => acc + (v.passengerShiftIds?.length || 0), 0)
})

const totalCost = computed(() => {
  return vehicles.value.reduce((acc, v) => acc + (v.sum || 0), 0)
})

// Employees with a shift but not assigned to any vehicle
const unassignedEmployees = computed(() => {
  const allShifts = shifts.value
  const allVehicles = vehicles.value

  // Collect all shift IDs assigned to all vehicles
  const assignedShiftIds = new Set<string>()
  for (const v of allVehicles) {
    if (v.driverShiftId) {
      assignedShiftIds.add(v.driverShiftId)
    }
    if (v.passengerShiftIds) {
      for (const pId of v.passengerShiftIds) {
        assignedShiftIds.add(pId)
      }
    }
  }

  // Find shifts that are not in the assigned set
  return allShifts
    .filter((shift) => !assignedShiftIds.has(shift.id))
    .map((shift) => {
      const emp = employeesStore.employees?.find((e) => e.id === shift.employeeId)
      return {
        id: shift.id,
        fullName: emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע',
        role: ShiftRoleLabels[shift.role] || shift.role,
      }
    })
})
</script>

<style scoped>
.toggle-header {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
  cursor: pointer;
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

.bg-summary-body {
  background: rgba(var(--v-theme-primary), 0.01) !important;
}

.border-error-subtle {
  border: 1px solid rgba(var(--v-theme-error), 0.25) !important;
}

.border-success-subtle {
  border: 1px solid rgba(var(--v-theme-success), 0.25) !important;
}

.bg-success-container {
  background: rgba(var(--v-theme-success), 0.03) !important;
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
