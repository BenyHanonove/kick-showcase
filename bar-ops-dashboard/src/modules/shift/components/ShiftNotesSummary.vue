<template>
  <v-container v-if="notedShifts.length > 0" class="pa-0 mb-6">
    <v-card variant="flat" class="sticky-notepad rounded-lg">
      <!-- Collapsed header: click to expand and read the notes -->
      <div
        class="pa-4 d-flex align-center justify-space-between cursor-pointer"
        @click="isOpen = !isOpen"
      >
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-pin" class="notepad-pin" size="small" />
          <span class="text-subtitle-1 font-weight-bold notepad-title">פתקי משמרות</span>
          <v-chip size="x-small" variant="flat" class="notepad-chip font-weight-bold">
            {{ notedShifts.length }}
          </v-chip>
        </div>
        <v-icon
          :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="small"
          class="notepad-title"
        />
      </div>

      <v-expand-transition>
        <div v-show="isOpen" class="px-4 pb-4">
          <v-row dense>
            <v-col v-for="entry in notedShifts" :key="entry.id" cols="12" sm="6" md="3">
              <div class="mini-note rounded-lg pa-3 h-100">
                <div class="font-weight-bold text-body-2 notepad-name">{{ entry.employeeName }}</div>
                <div class="text-caption notepad-role mb-1">{{ entry.roleLabel }}</div>
                <div class="text-body-2 notepad-note">{{ entry.notes }}</div>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { SessionStore, EmployeesStore } from '@stores'

import { type ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'

const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

const isOpen = ref(false)

const shifts = computed(() => sessionStore.registeredShifts)

// Collect all session shifts that carry a note
const notedShifts = computed(() => {
  return shifts.value
    .filter((shift) => shift.notes && shift.notes.trim().length > 0)
    .map((shift) => {
      const emp = employeesStore.get(shift.employeeId)
      return {
        id: shift.id,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע',
        roleLabel: ShiftRoleLabels[shift.role as ShiftRole],
        notes: shift.notes,
      }
    })
})
</script>

<style scoped>
/* Sticky-note look: warm paper background with dashed ruled lines */
.sticky-notepad {
  background: linear-gradient(180deg, #fff9c4, #fff59d) !important;
  border: 1px solid rgba(191, 144, 0, 0.3);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

.notepad-pin {
  color: #bf360c;
  transform: rotate(35deg);
}

.notepad-title,
.notepad-name,
.notepad-note {
  color: #4e342e;
}

.notepad-role {
  color: rgba(78, 52, 46, 0.6);
}

.notepad-chip {
  background: rgba(191, 144, 0, 0.2) !important;
  color: #4e342e !important;
}

.notepad-note {
  white-space: pre-wrap;
}

.mini-note {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(191, 144, 0, 0.25);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}
</style>
