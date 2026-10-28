<template>
  <div class="rs" dir="rtl">
    <VSelect
      :model-value="modelValue"
      :items="items"
      item-props
      variant="outlined"
      density="comfortable"
      label="באיזה תפקיד?"
      placeholder="בחר/י תפקיד"
      hide-details
      class="rs__select"
      :menu-props="{ contentClass: 'rs-menu' }"
      @update:model-value="emit('update:modelValue', $event)"
    />

  </div>
</template>

<script setup lang="ts">
// Role picker for the public registration page. Every role is always offered - the server
// sends no capacity, and the shift manager corrects the choice when they staff the event
import { VSelect } from 'vuetify/components'
import { ShiftRoleSelfLabels } from '@shift/types/IShiftRegistration.types'
import { ShiftRole } from '@shift/types/ShiftRole.types'

defineProps<{
  modelValue: ShiftRole | null
}>()

const emit = defineEmits<{
  'update:modelValue': [role: ShiftRole]
}>()

// Managing a bar or a floor is an assignment, not something you sign yourself up for -
// an admin sets those roles when staffing. The API still accepts them for that reason
const MANAGER_ROLES: ShiftRole[] = [ShiftRole.BAR_MANAGER, ShiftRole.WAITER_MANAGER]

// Straight off the enum, so the options can never drift from the roles the API accepts
const items = Object.values(ShiftRole)
  .filter((role) => !MANAGER_ROLES.includes(role))
  .map((role) => ({
    value: role,
    title: ShiftRoleSelfLabels[role],
  }))
</script>

<style scoped>
.rs__select :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.rs__select :deep(.v-field--focused) {
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
}

.rs__select :deep(.v-field__input),
.rs__select :deep(.v-select__selection-text) {
  color: #ffffff !important;
}

.rs__select :deep(.v-field__outline) {
  display: none !important;
}

.rs__select :deep(.v-label) {
  letter-spacing: 0.05em;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75) !important;
  opacity: 1;
}
</style>

<style>
.rs-menu .v-list {
  background-color: #111420 !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.rs-menu .v-list-item:hover {
  background-color: rgba(16, 185, 129, 0.15) !important;
  color: #10b981 !important;
}
</style>
