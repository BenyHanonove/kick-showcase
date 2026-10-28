<template>
  <v-card
    variant="flat"
    class="employee-card d-flex flex-column justify-space-between rounded-xl pa-4 w-100 border transition-all"
  >
    <div>
      <!-- Card Header -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" size="48" class="font-weight-bold text-white elevation-1">
            {{ employee.firstName[0] }}{{ employee.lastName[0] }}
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold">
              {{ employee.firstName }} {{ employee.lastName }}
            </h3>
            <v-chip
              size="x-small"
              color="warning"
              variant="tonal"
              class="mt-1"
              prepend-icon="mdi-clock-outline"
            >
              {{ EmployeeStatusLabels[EmployeeStatus.PENDING] }}
            </v-chip>
          </div>
        </div>
        <v-chip
          v-if="employee.type"
          size="small"
          color="secondary"
          variant="flat"
          class="font-weight-bold"
        >
          {{ EmployeeTypeLabels[employee.type] }}
        </v-chip>
      </div>

      <v-divider class="mb-4 opacity-60" />

      <!-- Card Details -->
      <div class="d-flex flex-column ga-3 mb-4 text-body-2">
        <div class="d-flex justify-space-between align-center py-0.5">
          <div class="d-flex align-center text-medium-emphasis ga-2">
            <v-icon size="16">mdi-card-account-details-outline</v-icon>
            <span>תעודת זהות</span>
          </div>
          <span class="font-weight-medium">{{ employee.identityNumber }}</span>
        </div>

        <div class="d-flex justify-space-between align-center py-0.5">
          <div class="d-flex align-center text-medium-emphasis ga-2">
            <v-icon size="16">mdi-phone-outline</v-icon>
            <span>מספר טלפון</span>
          </div>
          <span class="font-weight-medium" dir="ltr">
            <a
              :href="`tel:${employee.phone}`"
              class="text-decoration-none text-primary font-weight-bold"
            >
              {{ formatPhoneNumber(employee.phone) }}
            </a>
          </span>
        </div>

        <div v-if="employee.instagram" class="d-flex justify-space-between align-center py-0.5">
          <div class="d-flex align-center text-medium-emphasis ga-2">
            <v-icon size="16">mdi-instagram</v-icon>
            <span>אינסטגרם</span>
          </div>
          <span class="font-weight-medium" dir="ltr">
            <a
              :href="`https://instagram.com/${employee.instagram.replace('@', '')}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-decoration-none text-primary font-weight-bold"
            >
              {{
                employee.instagram.startsWith('@') ? employee.instagram : `@${employee.instagram}`
              }}
            </a>
          </span>
        </div>

        <div v-if="employee.address" class="d-flex justify-space-between align-center py-0.5">
          <div class="d-flex align-center text-medium-emphasis ga-2">
            <v-icon size="16">mdi-map-marker-outline</v-icon>
            <span>כתובת</span>
          </div>
          <span class="font-weight-medium">{{ employee.address }}</span>
        </div>

        <div v-if="employee.workExperience" class="d-flex flex-column ga-1 mt-2">
          <div class="d-flex align-center text-medium-emphasis ga-2 mb-1">
            <v-icon size="16">mdi-briefcase-outline</v-icon>
            <span class="font-weight-bold">ניסיון קודם</span>
          </div>
          <v-sheet
            class="experience-box pa-3 rounded-lg text-body-2"
          >
            {{ employee.workExperience }}
          </v-sheet>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <v-card-actions class="pa-0 mt-4 d-flex flex-column ga-2">
      <!-- Approve -->
      <AppButton
        color="success"
        variant="elevated"
        class="w-100 rounded-lg font-weight-bold action-btn"
        prepend-icon="mdi-check-decagram-outline"
        :loading="isApproving"
        :disabled="disabled"
        @click="emit('approve', employee)"
      >
        אישור
      </AppButton>

      <div class="d-flex w-100 ga-2">
        <!-- Edit -->
        <AppButton
          color="primary"
          variant="outlined"
          class="flex-grow-1 rounded-lg font-weight-bold action-btn"
          prepend-icon="mdi-pencil-outline"
          :disabled="disabled"
          @click="emit('edit', employee)"
        >
          ערוך
        </AppButton>

        <!-- Delete -->
        <AppButton
          color="error"
          variant="outlined"
          class="flex-grow-1 rounded-lg font-weight-bold action-btn"
          prepend-icon="mdi-delete-outline"
          :loading="isDeleting"
          :disabled="disabled"
          @click="emit('delete', employee)"
        >
          מחק
        </AppButton>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { EmployeeStatus, EmployeeStatusLabels } from '@employee/types/EmployeeStatus.types'
import { EmployeeTypeLabels } from '@employee/types/EmployeeType.types'
import type { IEmployee } from '@employee/types/IEmployee.types'
import { formatPhoneNumber } from '@shared/utils/formatters.util'

defineProps<{
  employee: IEmployee
  isApproving: boolean
  isDeleting: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'approve', employee: IEmployee): void
  (e: 'edit', employee: IEmployee): void
  (e: 'delete', employee: IEmployee): void
}>()
</script>

<style scoped>
.employee-card {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15) !important;
  box-shadow: var(--bo-shadow-card) !important;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--bo-shadow-raised) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.experience-box {
  background-color: rgba(var(--v-theme-on-surface), 0.03) !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.88);
  white-space: pre-line;
}

.action-btn {
  box-shadow: var(--bo-shadow-card) !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--bo-shadow-raised) !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
