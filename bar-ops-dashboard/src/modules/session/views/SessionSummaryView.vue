<template>
  <v-container class="py-6 px-4 max-width-container">
    <global-loading v-if="isInitialLoading" />

    <template v-else>
      <!-- Top Header Row -->
      <v-row class="mb-6 align-center">
        <v-col class="d-flex align-center">
          <v-btn
            icon="mdi-arrow-right"
            variant="tonal"
            color="primary"
            class="me-4 rounded-lg"
            @click="goBack"
          />
          <div>
            <div class="text-overline text-primary font-weight-bold mb-1">
              אנליטיקה וסיכום ביצועים
            </div>
            <h1 class="text-h4 font-weight-bold text-on-surface">
              {{ sessionStore.session?.name || 'סיכום אירוע' }}
            </h1>
            <p class="text-subtitle-2 text-medium-emphasis mb-0">
              דוח ביצועים פיננסי, תפעולי וכוח אדם מקיף
            </p>
          </div>
        </v-col>
      </v-row>

      <!-- SECTION 1: Executive Summary -->
      <v-row class="mb-2">
        <v-col cols="12">
          <SessionExecutiveSummaryCard />
        </v-col>
      </v-row>

      <!-- SECTION 2: Financial Analytics & Smart Labor -->
      <v-row class="mb-2">
        <v-col cols="12" md="6">
          <SessionFinancialCard class="h-100" />
        </v-col>
        <v-col cols="12" md="6">
          <ShiftSmartLaborCard class="h-100" />
        </v-col>
      </v-row>

      <!-- SECTION 2c: Tips Analytics -->
      <v-row class="mb-2">
        <v-col cols="12">
          <TipsAnalyticsCard />
        </v-col>
      </v-row>

      <!-- SECTION 3: Inventory & Logistics -->
      <v-row class="mb-2">
        <v-col cols="12" md="6">
          <ConsumeInventoryCard class="h-100" />
        </v-col>
        <v-col cols="12" md="6">
          <MissionLogisticsCard class="h-100" />
        </v-col>
      </v-row>

      <!-- SECTION 4: Expenses & Insights -->
      <v-row>
        <v-col cols="12" md="6">
          <SessionExpenseSummaryCard class="h-100" />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { SessionStore } from '@stores'
import { useSessionLoader } from '@session/composables/useSessionLoader'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'

// Import Refactored Cards from their respective modules
import SessionExecutiveSummaryCard from '@session/components/SessionExecutiveSummaryCard.vue'
import SessionFinancialCard from '@session/components/SessionFinancialCard.vue'
import ShiftSmartLaborCard from '@shift/components/ShiftSmartLaborCard.vue'
import TipsAnalyticsCard from '@tips/components/TipsAnalyticsCard.vue'
import ConsumeInventoryCard from '@consume/components/ConsumeInventoryCard.vue'
import SessionExpenseSummaryCard from '@expense/components/SessionExpenseSummaryCard.vue'
import MissionLogisticsCard from '@missions/components/MissionLogisticsCard.vue'

const route = useRoute()
const router = useRouter()
const sessionStore = SessionStore()

const { loadFullSession, isInitialLoading } = useSessionLoader()

const sessionId = route.params.id as string
const clientId = route.params.clientId as string

onMounted(() => {
  if (sessionId && clientId) {
    loadFullSession(sessionId, clientId)
  }
})

const goBack = () => {
  if (sessionId) {
    router.push({
      name: 'session-details',
      params: { clientId: clientId || 'general', id: sessionId },
    })
  } else {
    router.back()
  }
}
</script>

<style scoped>
.max-width-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
