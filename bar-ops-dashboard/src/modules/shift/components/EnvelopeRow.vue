<template>
  <v-card variant="outlined" class="rounded-lg pa-4 bg-card shadow-sm">
    <div class="d-flex justify-space-between align-center">
      <div class="d-flex align-center ga-3">
        <AppButton
          icon
          variant="text"
          :color="shift.received ? 'success' : 'grey-lighten-1'"
          :style="!hasManagerAccess ? { pointerEvents: 'none' } : {}"
          @click="emit('toggleReceived', shift)"
          :loading="loading"
          class="rounded-circle"
          size="small"
        >
          <v-icon
            :icon="shift.received ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
            size="26"
          />
        </AppButton>

        <div>
          <div class="text-h6 font-weight-bold">
            {{ employeeName }}
          </div>
        </div>
      </div>

      <div>
        <v-chip color="primary" variant="flat" class="font-weight-bold px-3 py-1">
          ₪{{ price.toFixed(2) }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { AuthStore, RoleLevel } from '@stores'
import { UserRole } from '@auth/types/IUser.types'

import type { IShift } from '@shift/types/IShift.types'

defineProps<{
  shift: IShift
  employeeName: string
  price: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleReceived', shift: IShift): void
}>()

const authStore = AuthStore()

const hasManagerAccess = computed(() => {
  if (!authStore.role) return false
  const userLevel = RoleLevel[authStore.role] || 0
  const managerLevel = RoleLevel[UserRole.MANAGER] || 0
  return userLevel >= managerLevel
})
</script>

<style scoped>
.bg-card {
  background: var(--v-theme-surface);
}
</style>
