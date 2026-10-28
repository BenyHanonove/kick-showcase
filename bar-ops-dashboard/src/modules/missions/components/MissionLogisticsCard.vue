<template>
  <ModuleSummaryCard
    title="לוגיסטיקה ותפעול שטח"
    icon="mdi-truck-delivery-outline"
    icon-color="purple"
    title-color="rgb(139, 92, 246)"
  >
    <!-- Logistic Cost -->
    <div class="metric-row">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-gas-station" size="20" />
          <span class="text-body-2 font-weight-medium">עלות לוגיסטית</span>
        </div>
        <v-chip color="grey" variant="tonal" size="small">בקרוב</v-chip>
      </div>
    </div>

    <v-divider class="my-3" />

    <!-- Mission Completion -->
    <div class="metric-row">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon icon="mdi-checkbox-marked-circle-outline" size="20" />
        <span class="text-body-2 font-weight-medium">קצב השלמת משימות</span>
      </div>
      <template v-if="missions.length > 0">
        <div class="d-flex align-center ga-3 mb-2">
          <v-progress-circular
            :model-value="missionCompletionRate"
            :size="56"
            :width="6"
            :color="
              missionCompletionRate === 100
                ? 'success'
                : missionCompletionRate > 50
                  ? 'info'
                  : 'warning'
            "
          >
            <span class="text-caption font-weight-bold"
              >{{ Math.round(missionCompletionRate) }}%</span
            >
          </v-progress-circular>
          <div class="d-flex flex-column">
            <span class="text-body-2"
              >{{ completedMissions }} / {{ missions.length }} משימות הושלמו</span
            >
            <span v-if="pendingMissions > 0" class="text-caption text-warning font-weight-medium">
              {{ pendingMissions }} משימות בהמתנה
            </span>
          </div>
        </div>
      </template>
      <div v-else class="text-caption text-medium-emphasis">אין משימות</div>
    </div>
  </ModuleSummaryCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SessionStore } from '@stores'
import { MissionStatus } from '@missions/types/status.types'
import ModuleSummaryCard from '@shared/components/layout/ModuleSummaryCard.vue'

const sessionStore = SessionStore()

const missions = computed(() => sessionStore.missions?.data || [])

const completedMissions = computed(
  () => missions.value.filter((m) => m.status === MissionStatus.COMPLETED).length,
)
const pendingMissions = computed(
  () => missions.value.filter((m) => m.status !== MissionStatus.COMPLETED).length,
)
const missionCompletionRate = computed(() => {
  return missions.value.length > 0 ? (completedMissions.value / missions.value.length) * 100 : 0
})
</script>

<style scoped>
.metric-row {
  padding: 4px 0;
}
</style>
