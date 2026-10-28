<template>
  <div class="missions-overview">
    <div class="missions-overview__header">
      <h3 class="missions-overview__title">אלו המשימות שלך החודש</h3>
    </div>

    <v-row class="missions-overview__grid">
      <!-- Total Missions Card -->
      <v-col v-if="getTotalMissions() > 0" cols="3">
        <v-card class="stat-card stat-card--total" elevation="0">
          <v-card-text class="stat-card__content">
            <div class="stat-card__icon-wrapper">
              <v-icon class="stat-card__icon" color="primary" icon="mdi-list-status"></v-icon>
            </div>
            <div class="stat-card__text">
              <div class="stat-card__label">סה"כ</div>
              <div class="stat-card__number">{{ getTotalMissions() }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Status Cards -->
      <v-col v-for="status in statuses" :key="status" cols="3">
        <v-tooltip
          v-if="getCountByStatus(status) > 0"
          :text="getTooltipText(status)"
          location="top"
        >
          <template #activator="{ props }">
            <v-card v-bind="props" class="stat-card" :class="`stat-card--${status}`" elevation="0">
              <v-card-text class="stat-card__content">
                <div class="stat-card__icon-wrapper">
                  <v-icon
                    class="stat-card__icon"
                    :color="getMissionStatusMeta(status).color"
                    :icon="getMissionStatusMeta(status).icon"
                  ></v-icon>
                </div>
                <div class="stat-card__text">
                  <div class="stat-card__label">{{ getStatusLabel(status) }}</div>
                  <div class="stat-card__number">{{ getCountByStatus(status) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </template>
        </v-tooltip>
        <v-card v-else class="stat-card" :class="`stat-card--${status}`" elevation="0">
          <v-card-text class="stat-card__content">
            <div class="stat-card__icon-wrapper">
              <v-icon
                class="stat-card__icon"
                :color="getMissionStatusMeta(status).color"
                :icon="getMissionStatusMeta(status).icon"
              ></v-icon>
            </div>
            <div class="stat-card__text">
              <div class="stat-card__label">{{ getStatusLabel(status) }}</div>
              <div class="stat-card__number">{{ getCountByStatus(status) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { MissionsStore } from '@stores'
import { MissionStatus, getMissionStatusMeta } from '@missions/types/status.types'
import type { IMission } from '@missions/types/IMission.types'

const missionsStore = MissionsStore()

const statuses = [MissionStatus.PENDING, MissionStatus.WORKING, MissionStatus.COMPLETED]

const getCountByStatus = (status: MissionStatus): number => {
  if (!missionsStore.missions) return 0
  return missionsStore.missions.filter((mission: IMission) => mission.status === status).length
}

const getTooltipText = (status: MissionStatus): string => {
  const count = getCountByStatus(status)
  return `${count} משימות ${getMissionStatusMeta(status).label}`
}

const getTotalMissions = (): number => {
  if (!missionsStore.missions) return 0
  return missionsStore.missions.length
}

const getStatusLabel = (status: MissionStatus): string => {
  const labels: Record<MissionStatus, string> = {
    [MissionStatus.PENDING]: 'המתנה',
    [MissionStatus.WORKING]: 'טיפול',
    [MissionStatus.COMPLETED]: 'הושלם',
  }
  return labels[status]
}
</script>

<style scoped>
.missions-overview__header {
  margin-bottom: 1.5rem;
}

.missions-overview__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.stat-card__content {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem !important;
}

@media (min-width: 600px) {
  .stat-card__content {
    flex-direction: row;
  }
}

.stat-card__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .stat-card__icon-wrapper {
    width: 28px;
    height: 28px;
  }
}

.stat-card__icon {
  font-size: 20px !important;
}

@media (min-width: 600px) {
  .stat-card__icon {
    font-size: 16px !important;
  }
}

.stat-card__text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-card__label {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.7;
  text-align: center;
}

@media (min-width: 600px) {
  .stat-card__label {
    text-align: right;
  }
}

.stat-card__number {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
}
</style>
