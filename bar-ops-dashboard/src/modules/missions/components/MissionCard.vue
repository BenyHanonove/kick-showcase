<template>
  <v-card variant="flat" class="mission-card rounded-xl border transition-all animate-fade-in">
    <div class="d-flex align-center justify-space-between w-100 pa-3 pa-sm-4">
      <!-- Left section: Check circle status + Text -->
      <div class="d-flex align-start ga-3 flex-grow-1">
        <AppButton
          icon
          variant="text"
          :color="statusMeta.color"
          @click="emit('toggle', mission)"
          :loading="loading"
          class="rounded-circle mt-n1"
        >
          <v-icon :icon="statusMeta.icon" size="26" />
        </AppButton>

        <div class="text-right">
          <div class="d-flex align-center ga-2 mb-1">
            <h3
              :class="[
                'text-body-1 font-weight-black mb-0 leading-tight transition-all',
                {
                  'text-decoration-line-through text-disabled':
                    mission.status === MissionStatus.COMPLETED,
                },
              ]"
            >
              {{ mission.name }}
            </h3>
            <StatusChip
              :meta="statusMeta"
              size="x-small"
              density="compact"
            />
          </div>
          <p
            :class="[
              'text-body-2 mb-0 transition-all',
              mission.status === MissionStatus.COMPLETED ? 'text-disabled' : 'text-medium-emphasis',
            ]"
          >
            {{ mission.desc }}
          </p>
        </div>
      </div>

      <!-- Right section: Edit Menu (Manager and above) -->
      <AuthWrapper :level="UserRole.MANAGER">
        <v-menu v-model="menuOpen">
          <template #activator="{ props: menuProps }">
            <AppButton
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              color="medium-emphasis"
              v-bind="menuProps"
              class="rounded-circle"
            />
          </template>
          <AppList :actions="menuActions" />
        </v-menu>
      </AuthWrapper>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserRole } from '@auth/types/IUser.types'
import type { IMission } from '@missions/types/IMission.types'
import { MissionStatus, getMissionStatusMeta } from '@missions/types/status.types'
import type { IListAction } from '@shared/types/IListAction.types'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import StatusChip from '@shared/components/data/StatusChip.vue'

const props = defineProps<{
  mission: IMission
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', mission: IMission): void
  (e: 'edit', mission: IMission): void
  (e: 'delete', mission: IMission): void
}>()

const statusMeta = computed(() => getMissionStatusMeta(props.mission.status))

const menuOpen = ref(false)

// Menu actions — destructive actions sit in their own group
const menuActions: IListAction[][] = [
  [{ title: 'עדכן', icon: 'mdi-pencil', handler: () => emit('edit', props.mission) }],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => emit('delete', props.mission) }],
]
</script>

<style scoped>
.mission-card {
  background: var(--v-theme-surface);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity, 0.12)) !important;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.mission-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.05);
  border-color: rgb(var(--v-theme-success)) !important;
}

.text-decoration-line-through {
  text-decoration: line-through;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
