<template>
  <v-card
    variant="outlined"
    :class="['rounded-lg pa-4 h-100 bg-card shadow-sm', { 'border-primary border-md': selectMode && selected, 'cursor-pointer': selectMode }]"
    @click="selectMode ? emit('select', shift) : undefined"
  >
    <div class="d-flex justify-space-between align-start mb-4">
      <div class="d-flex align-center ga-3">
        <AppButton
          v-if="selectMode"
          icon
          variant="text"
          :color="selected ? 'primary' : 'grey-lighten-1'"
          @click.stop="emit('select', shift)"
          class="rounded-circle"
          size="small"
        >
          <v-icon :icon="selected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'" size="26" />
        </AppButton>
        <AppButton
          v-else
          icon
          variant="text"
          :color="shift.approved ? 'success' : 'grey-lighten-1'"
          :style="!hasManagerAccess ? { pointerEvents: 'none' } : {}"
          @click="emit('toggleApproved', shift)"
          :loading="loading"
          class="rounded-circle"
          size="small"
        >
          <v-icon :icon="shift.approved ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'" size="26" />
        </AppButton>

        <div>
          <div class="text-h6 font-weight-bold">
            {{ employee ? `${employee.firstName} ${employee.lastName}` : 'טוען...' }}
          </div>
          <div v-if="shift.timing" class="text-caption text-medium-emphasis d-flex align-center ga-1">
            <v-icon size="small">mdi-clock-time-four-outline</v-icon>
            {{ useFormatter().formatShiftTiming(shift.timing) }}
          </div>
          <v-chip
            v-else
            size="x-small"
            variant="tonal"
            color="warning"
            prepend-icon="mdi-clock-alert-outline"
            class="mt-1"
          >
            חסר תזמון
          </v-chip>
          <v-menu v-if="shift.notes" location="bottom start" max-width="320" offset="4">
            <template #activator="{ props: menuProps }">
              <span
                v-bind="menuProps"
                class="note-link text-caption text-primary d-inline-flex align-center ga-1"
                @click.stop
              >
                <v-icon size="x-small">mdi-note-text-outline</v-icon>
                הערה
              </span>
            </template>
            <v-card max-width="320" class="rounded-lg pa-3">
              <div class="d-flex align-center ga-1 mb-1 text-caption font-weight-bold text-medium-emphasis">
                <v-icon size="small" color="warning">mdi-note-text-outline</v-icon>
                הערת משמרת
              </div>
              <div class="text-body-2 note-text">{{ shift.notes }}</div>
            </v-card>
          </v-menu>
        </div>
      </div>

      <auth-wrapper :level="UserRole.ADMIN">
        <v-chip size="small" variant="flat" color="grey-lighten-3" class="font-weight-bold">
          {{ Number((shift.totalHours || 0).toFixed(2)) }} שעות
        </v-chip>
      </auth-wrapper>
    </div>

    <v-divider class="mb-4" />

    <auth-wrapper :level="UserRole.ADMIN"> </auth-wrapper>

    <div class="d-flex justify-space-between align-center">
      <auth-wrapper :level="UserRole.ADMIN">
        <div class="d-flex flex-wrap ga-1">
          <template v-if="hasBonuses">
            <v-chip
              v-if="shift.bonusTravel && shift.bonusTravel > 0"
              size="small"
              color="info"
              variant="tonal"
              prepend-icon="mdi-car"
            >
              ₪{{ shift.bonusTravel }} נסיעות
            </v-chip>
            <v-chip
              v-if="shift.bonusManage && shift.bonusManage > 0"
              size="small"
              color="warning"
              variant="tonal"
              prepend-icon="mdi-crown"
            >
              ₪{{ shift.bonusManage }} ניהול
            </v-chip>
            <v-chip
              v-if="shift.bonusSetup && shift.bonusSetup > 0"
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-wrench"
            >
              ₪{{ shift.bonusSetup }} הקמה
            </v-chip>
            <v-chip
              v-if="shift.bonusOther && shift.bonusOther > 0"
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="mdi-cash-plus"
            >
              ₪{{ shift.bonusOther }} אחר
            </v-chip>
          </template>
          <span v-else class="text-caption text-disabled italic">ללא בונוסים</span>
        </div>
      </auth-wrapper>

      <div class="d-flex ga-1" v-if="!selectMode">
        <AppButton
          icon="mdi-clock-outline"
          variant="tonal"
          size="x-small"
          color="info"
          @click.stop="emit('openIntervals', shift)"
        />
        <AppButton
          icon="mdi-pencil"
          variant="tonal"
          size="x-small"
          color="primary"
          @click.stop="emit('edit', shift)"
        />
        <AppButton
          icon="mdi-delete"
          variant="tonal"
          size="x-small"
          color="error"
          @click.stop="handleDelete"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { AuthStore, RoleLevel, EmployeesStore } from '@stores'

import { useFormatter } from '@shared/composables/useFormatter.composable'

import AuthWrapper from '@auth/components/AuthWrapper.vue'

import type { IShift } from '@shift/types/IShift.types'
import { UserRole } from '@auth/types/IUser.types'

const props = withDefaults(
  defineProps<{
    shift: IShift
    loading?: boolean
    selectMode?: boolean
    selected?: boolean
  }>(),
  {
    loading: false,
    selectMode: false,
    selected: false,
  }
)

const emit = defineEmits<{
  (e: 'edit', shift: IShift): void
  (e: 'delete', shift: IShift): void
  (e: 'openIntervals', shift: IShift): void
  (e: 'toggleApproved', shift: IShift): void
  (e: 'select', shift: IShift): void
}>()

const shift = computed(() => props.shift)
const employee = EmployeesStore().get(shift.value.employeeId)

const authStore = AuthStore()
const hasManagerAccess = computed(() => {
  if (!authStore.role) return false
  const userLevel = RoleLevel[authStore.role] || 0
  const managerLevel = RoleLevel[UserRole.MANAGER] || 0
  return userLevel >= managerLevel
})

const totalBonuses = computed(() => {
  return (
    (shift.value.bonusTravel || 0) +
    (shift.value.bonusManage || 0) +
    (shift.value.bonusSetup || 0) +
    (shift.value.bonusOther || 0)
  )
})

const hasBonuses = computed(() => totalBonuses.value > 0)

const handleDelete = () => {
  emit('delete', props.shift)
}
</script>

<style scoped>
.note-link {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.note-text {
  white-space: pre-wrap;
}
</style>
