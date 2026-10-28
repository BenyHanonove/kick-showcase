<template>
  <v-container class="py-6 px-4 max-width-container pb-28">
    <!-- Single unified card -->
    <v-card class="rounded-xl border elevation-0 bg-card overflow-hidden">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between pa-5 bg-primary-lighten-5">
        <div class="d-flex align-center ga-3">
          <div>
            <h1 class="text-h5 font-weight-bold primary--text">עדכון שעתי מרוכז</h1>
            <p class="text-subtitle-2 text-medium-emphasis mb-0">
              עדכון תעריף שעתי עבור משמרות האירוע
            </p>
          </div>
        </div>

        <v-chip color="primary" variant="flat" class="font-weight-bold">
          {{ shifts.length }} משמרות
        </v-chip>
      </div>

      <!-- Empty State -->
      <template v-if="shifts.length === 0">
        <v-divider />
        <div class="pa-8 text-center">
          <v-icon size="48" color="medium-emphasis" class="mb-3">mdi-calendar-remove</v-icon>
          <div class="text-h6 font-weight-medium text-medium-emphasis">אין משמרות להצגה</div>
          <div class="text-body-2 text-medium-emphasis">לא נמצאו משמרות עבור אירוע זה</div>
        </div>
      </template>

      <!-- Shifts Tables by Role -->
      <template v-else>
        <template v-for="(roleShifts, role) in localShiftsByRole" :key="role">
          <v-divider />

          <!-- Role Label Row -->
          <div class="d-flex align-center justify-space-between px-5 py-3 bg-primary-lighten-5">
            <div class="d-flex align-center ga-3">
              <v-icon color="primary" size="small">mdi-account-group</v-icon>
              <span class="text-subtitle-1 font-weight-bold text-primary">
                {{ ShiftRoleLabels[role as ShiftRole] || role }}
              </span>
            </div>
            <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
              {{ roleShifts.length }} עובדים
            </v-chip>
          </div>

          <div class="px-5 pb-5 pt-4">
            <AppTable
              :items="roleShifts"
              :headers="headers"
              :loading="isLoading"
              sticky-first-column
              class="hourly-rates-table"
            >
              <!-- Header Checkbox Slot -->
              <template #header(select)>
                <v-checkbox-btn
                  :model-value="areRoleShiftsAllSelected(roleShifts)"
                  :indeterminate="isRoleShiftsIndeterminate(roleShifts)"
                  @update:model-value="toggleSelectAllRoleShifts(roleShifts, $event)"
                  hide-details
                  density="compact"
                  class="centered-checkbox"
                />
              </template>

              <!-- Body Checkbox Slot -->
              <template #select="{ item }">
                <v-checkbox-btn
                  :model-value="selectedShiftIds.includes(item.id)"
                  @update:model-value="toggleSelect(item.id)"
                  hide-details
                  density="compact"
                  class="centered-checkbox"
                />
              </template>

              <!-- Employee Name Slot -->
              <template #employeeName="{ item }">
                <div class="font-weight-bold">
                  {{ getEmployeeName(item.employeeId) }}
                </div>
              </template>

              <!-- Hours Slot -->
              <template #totalHours="{ value }">
                <span class="font-weight-bold">{{ Number(value || 0).toFixed(2) }} שעות</span>
              </template>

              <!-- Hourly Rate Input Slot -->
              <template #hourly="{ item }">
                <div class="d-flex justify-center align-center">
                  <v-text-field
                    v-model.number="item.hourly"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                    prefix="₪"
                    class="hourly-input rounded-lg"
                    clearable
                    @keydown.enter.prevent="handleEnterKey"
                  />
                </div>
              </template>
            </AppTable>
          </div>
        </template>
      </template>
    </v-card>
  </v-container>

  <!-- Sticky bottom bar — teleported to body to escape v-main overflow -->
  <Teleport to="body">
    <div class="sticky-save-wrapper">
      <div class="pa-4 sticky-save-panel">
        <div class="d-flex align-center ga-3 w-100">
          <div class="flex-grow-1">
            <v-text-field
              v-model.number="bulkRate"
              label="תעריף שעתי להחלה"
              type="number"
              prefix="₪"
              hide-details
              variant="outlined"
              density="comfortable"
              class="rounded-lg"
            />
          </div>
          <div>
            <AppButton
              color="primary"
              variant="flat"
              prepend-icon="mdi-check"
              height="48"
              class="sticky-save-btn rounded-lg font-weight-bold px-6"
              :loading="isSubmitting"
              :disabled="shifts.length === 0"
              @click="saveChanges"
            >
              עדכן
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { SessionStore, EmployeesStore } from '@stores'
import { useShiftCrud } from '@shift/composables/shift.crud'

import AppTable from '@shared/components/data/AppTable.vue'

import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import { type IShift } from '@shift/types/IShift.types'

const router = useRouter()
const route = useRoute()
const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

const isLoading = ref(false)
const isSubmitting = ref(false)
const bulkRate = ref<number | null>(null)
const selectedShiftIds = ref<string[]>([])

// Local mutable copies so v-model never mutates the store
const localShifts = ref<IShift[]>([])

// CRUD initialization — also wire the bulk-hourly composable
const shiftCrud = useShiftCrud(sessionStore.shifts)
const { handleBulkHourlyUpdate, takeHourlySnapshot, isBulkHourlyUpdating } = shiftCrud

// Shifts list for this session
const shifts = computed(() => sessionStore.registeredShifts)

// Group shifts by role with a defined order
const roleOrder = [
  ShiftRole.BAR_MANAGER,
  ShiftRole.WAITER_MANAGER,
  ShiftRole.BARTENDER,
  ShiftRole.WAITER,
  ShiftRole.RUNNER,
]

// Group LOCAL shifts by role (same ordering as before)
const localShiftsByRole = computed(() => {
  const groups: Record<string, IShift[]> = {}

  localShifts.value.forEach((shift) => {
    const role = shift.role || 'unknown'
    if (!groups[role]) {
      groups[role] = []
    }
    groups[role].push(shift)
  })

  const sortedGroups: Record<string, IShift[]> = {}

  roleOrder.forEach((role) => {
    const roleShifts = groups[role]
    if (roleShifts) {
      sortedGroups[role] = roleShifts
    }
  })

  Object.keys(groups).forEach((role) => {
    if (!sortedGroups[role]) {
      const roleShifts = groups[role]
      if (roleShifts) {
        sortedGroups[role] = roleShifts
      }
    }
  })

  return sortedGroups
})

// Populate local shifts from the store and take a snapshot for diffing
const populateLocalShifts = () => {
  // Deep-copy each shift so edits don't mutate the store
  localShifts.value = shifts.value.map((s) => ({ ...s }))
  // Let useBulkUpdate know what the "before" state is
  takeHourlySnapshot()
}

onMounted(populateLocalShifts)

const areRoleShiftsAllSelected = (roleShifts: IShift[]) => {
  return roleShifts.length > 0 && roleShifts.every((s) => selectedShiftIds.value.includes(s.id))
}

const isRoleShiftsIndeterminate = (roleShifts: IShift[]) => {
  const selectedCount = roleShifts.filter((s) => selectedShiftIds.value.includes(s.id)).length
  return selectedCount > 0 && selectedCount < roleShifts.length
}

const toggleSelectAllRoleShifts = (roleShifts: IShift[], val: boolean | null) => {
  if (val) {
    roleShifts.forEach((s) => {
      if (!selectedShiftIds.value.includes(s.id)) {
        selectedShiftIds.value.push(s.id)
      }
    })
  } else {
    const roleShiftIds = roleShifts.map((s) => s.id)
    selectedShiftIds.value = selectedShiftIds.value.filter((id) => !roleShiftIds.includes(id))
  }
}

const toggleSelect = (id: string) => {
  const index = selectedShiftIds.value.indexOf(id)
  if (index > -1) {
    selectedShiftIds.value.splice(index, 1)
  } else {
    selectedShiftIds.value.push(id)
  }
}

// Save Changes via handleBulkHourlyUpdate (useBulkUpdate composable)
const saveChanges = async () => {
  isSubmitting.value = true

  // Apply bulk rate to selected shifts if a rate was specified
  if (
    bulkRate.value !== null &&
    bulkRate.value !== undefined &&
    selectedShiftIds.value.length > 0
  ) {
    localShifts.value.forEach((s) => {
      if (selectedShiftIds.value.includes(s.id)) {
        s.hourly = bulkRate.value as number
      }
    })
  }

  // ─── DEBUG: before / after / diff ────────────────────────────────────────
  const before: Record<string, number | null | undefined> = {}
  const after: Record<string, number | null | undefined> = {}
  const diff: {
    id: string
    before: number | null | undefined
    after: number | null | undefined
  }[] = []

  shifts.value.forEach((s) => {
    before[s.id] = s.hourly
  })
  localShifts.value.forEach((s) => {
    after[s.id] = s.hourly
    if (before[s.id] !== s.hourly) {
      diff.push({ id: s.id, before: before[s.id], after: s.hourly })
    }
  })

  console.groupEnd()
  // ─────────────────────────────────────────────────────────────────────────

  const result = await handleBulkHourlyUpdate(localShifts.value, 'hourly')
  isSubmitting.value = false
  if (result !== 'error') {
    goBack()
  }
}

const handleEnterKey = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement
  const inputs = Array.from(document.querySelectorAll('.hourly-input input')) as HTMLInputElement[]
  const currentIndex = inputs.indexOf(target)
  if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
    const nextInput = inputs[currentIndex + 1]
    if (nextInput) {
      nextInput.focus()
      nextInput.select()
    }
  }
}

// Helper methods
const getEmployeeName = (employeeId: string) => {
  const emp = employeesStore.get(employeeId)
  return emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע'
}

const goBack = () => {
  router.push({
    name: 'session-details',
    params: { clientId: route.params.clientId, id: route.params.id },
  })
}

// Suppress unused-var warning; kept for parent consumers
void isBulkHourlyUpdating

// Table Headers configuration
const headers = [
  { key: 'select', label: '', align: 'center' as const },
  { key: 'employeeName', label: 'שם עובד', align: 'right' as const },
  { key: 'totalHours', label: 'שעות', align: 'center' as const },
  { key: 'hourly', label: 'תעריף שעתי', align: 'center' as const },
]
</script>

<style scoped>
.max-width-container {
  max-width: 1000px;
  margin: 0 auto;
}
.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
.hourly-rates-table :deep(td) {
  vertical-align: middle;
}
.hourly-input :deep(input) {
  text-align: center;
}

/* Max-width constraint for hourly rate text fields */
.hourly-input {
  max-width: 140px;
}

.centered-checkbox {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 auto !important;
}

/* Sticky save bar — teleported to body to escape v-main overflow */
.sticky-save-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none;
  /* Fades from the page background into transparent, no hard edge */
  padding-top: 32px;
  background: linear-gradient(
    to top,
    rgb(var(--v-theme-background)) 60%,
    rgba(var(--v-theme-background), 0)
  );
}

.sticky-save-panel {
  width: 100%;
  max-width: 600px;
  pointer-events: auto;
}
</style>
