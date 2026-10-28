<template>
  <v-col>
    <!-- Empty: title + subtitle. With data: a full-width add button instead. -->
    <PageHeader
      v-if="totalMissionsCount === 0"
      :path="[]"
      title="ניהול משימות"
      desc="מעקב וניהול המשימות עבור הסשן הנוכחי"
      :min-role="UserRole.MANAGER"
    />

    <auth-wrapper v-else :level="UserRole.MANAGER">
      <AppButton
        block
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        rounded="lg"
        class="mb-4 font-weight-bold"
        @click="MissionsCrud.createDialogOpen.value = true"
      >
        הוסף משימה
      </AppButton>
    </auth-wrapper>

    <!-- Progress Indicator -->
    <v-card v-if="totalMissionsCount > 0" flat class="border rounded-xl pa-4 mb-6 progress-card">
      <div class="d-flex align-center justify-space-between flex-wrap ga-4">
        <div>
          <h6 class="text-subtitle-1 font-weight-black mb-1">התקדמות המשימות</h6>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ completedMissionsCount }} מתוך {{ totalMissionsCount }} משימות הושלמו
          </p>
        </div>
        <div class="d-flex align-center ga-3 progress-bar-wrapper">
          <v-progress-linear
            :model-value="completionPercentage"
            color="success"
            height="10"
            rounded
            class="flex-grow-1"
          />
          <span class="text-subtitle-2 font-weight-bold text-success"
            >{{ Math.round(completionPercentage) }}%</span
          >
        </div>
      </div>
    </v-card>

    <!-- Missions Checklist Grid -->
    <v-row v-if="totalMissionsCount > 0" dense>
      <v-col v-for="mission in missions" :key="mission.id" cols="12">
        <MissionCard
          :mission="mission"
          :loading="togglingIds.has(mission.id)"
          @toggle="toggleStatus"
          @edit="MissionsCrud.openUpdate"
          @delete="MissionsCrud.openDelete"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <empty-state v-else icon="mdi-clipboard-text-outline" feature="משימות">
      <auth-wrapper :level="UserRole.MANAGER">
        <AppButton
          block
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          rounded="lg"
          class="font-weight-bold"
          @click="MissionsCrud.createDialogOpen.value = true"
        >
          הוסף משימה
        </AppButton>
      </auth-wrapper>
    </empty-state>

    <!-- Create Dialog -->
    <AppDialog v-model="MissionsCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת משימה חדשה"
        submit-text="צור משימה"
        :loading="MissionsCrud.isCreating.value"
        :fields="createFields"
        :initial-values="MissionsCrud.missionInitialState(sessionStore.session?.id || '')"
        show-reset
        @submit="MissionsCrud.handleCreate"
      />
    </AppDialog>

    <!-- Update Dialog -->
    <AppDialog v-model="MissionsCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="MissionsCrud.selectedItem.value"
        title="עריכת משימה"
        submit-text="עדכן משימה"
        :loading="MissionsCrud.isUpdating.value"
        :fields="MissionsCrud.missionsFields"
        :initial-values="MissionsCrud.selectedItem.value"
        show-cancel
        @submit="MissionsCrud.handleUpdate"
        @cancel="MissionsCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <!-- Delete Dialog -->
    <AppDialog
      v-model="MissionsCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת משימה"
      :item-name="MissionsCrud.selectedItem.value?.name || ''"
      :loading="MissionsCrud.isDeleting.value"
      @confirm="MissionsCrud.handleDelete"
      @cancel="MissionsCrud.deleteDialogOpen.value = false"
    />
  </v-col>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Import stores and composables
import { SessionStore, SnackbarStore } from '@stores'
import { useMissionsCrud } from '@missions/composables/missions.crud'
import { missionsProvider } from '@missions/providers/missions.provider'

// Import types
import { UserRole } from '@auth/types/IUser.types'
import type { IMission, IUpdateMission } from '@missions/types/IMission.types'
import { MissionStatus } from '@missions/types/status.types'

// Import custom components
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import MissionCard from '@missions/components/MissionCard.vue'

// Initialize stores and CRUD
const sessionStore = SessionStore()
const snackbarStore = SnackbarStore()
const MissionsCrud = useMissionsCrud()

// Reactive map to hold loading states for inline toggling
const togglingIds = ref(new Set<string>())

// Compute missions list
const missions = computed(() => sessionStore.missions?.data || [])

// Creation excludes status field; new missions start pending
const createFields = computed(() => MissionsCrud.missionsFields.filter((f) => f.key !== 'status'))

// Progress counters
const totalMissionsCount = computed(() => missions.value.length)
const completedMissionsCount = computed(
  () => missions.value.filter((m) => m.status === MissionStatus.COMPLETED).length,
)
const completionPercentage = computed(() => {
  if (totalMissionsCount.value === 0) return 0
  return (completedMissionsCount.value / totalMissionsCount.value) * 100
})

// Inline toggle function for fast checkbox response
const toggleStatus = async (mission: IMission) => {
  if (togglingIds.value.has(mission.id)) return

  togglingIds.value.add(mission.id)
  try {
    const isCompleted = mission.status === MissionStatus.COMPLETED
    const nextStatus = isCompleted ? MissionStatus.PENDING : MissionStatus.COMPLETED
    const payload: IUpdateMission = {
      id: mission.id,
      timestamp: mission.timestamp,
      status: nextStatus,
    }
    const result = await missionsProvider.update(mission.id, payload)
    if (result.success && result.data) {
      sessionStore.missions.update(result.data)
      snackbarStore.open(
        nextStatus === MissionStatus.COMPLETED ? 'המשימה סומנה כהושלמה' : 'המשימה הוחזרה לביצוע',
        'success',
      )
    } else {
      snackbarStore.open(result.message || 'שגיאה בעדכון סטטוס משימה', 'error')
    }
  } catch (error) {
    snackbarStore.open(error instanceof Error ? error.message : 'ארעה שגיאה בלתי צפויה', 'error')
  } finally {
    togglingIds.value.delete(mission.id)
  }
}
</script>

<style scoped>
.progress-card {
  background: var(--v-theme-surface);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity, 0.12)) !important;
}

.progress-bar-wrapper {
  min-width: 240px;
  flex-grow: 1;
  max-width: 450px;
}
</style>
