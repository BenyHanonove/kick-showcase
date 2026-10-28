<template>
  <v-card
    variant="flat"
    class="surplus-card rounded-lg pa-5 border overflow-hidden position-relative mb-6"
  >
    <div class="glow-bg"></div>

    <v-row align="center" class="z-index-1">
      <!-- Main surplus highlight -->
      <v-col cols="12" md="4" class="d-flex align-center ga-4 border-divider mb-4 mb-md-0">
        <v-avatar color="amber-lighten-4" class="avatar-hover-animate" size="52">
          <v-icon icon="mdi-cash-refund" color="amber-darken-3" size="30"></v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold text-medium-emphasis">עודף טיפ (נותר בקופה)</div>
          <div class="text-h4 font-weight-black text-amber-darken-3 mt-1">
            ₪{{ formatNumber(props.surplus) }}
          </div>
        </div>
      </v-col>

      <!-- Breakdown items -->
      <v-col cols="12" md="8" class="px-md-6">
        <v-row dense class="align-center">
          <!-- Total Tips -->
          <v-col cols="12" sm="4" class="py-2 py-sm-0">
            <div class="d-flex align-center ga-3">
              <v-icon icon="mdi-cash-multiple" color="primary" size="20"></v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">סה"כ טיפים (בר + שולחנות)</div>
                <div class="text-subtitle-1 font-weight-bold text-primary">
                  ₪{{ formatNumber(props.totalTips) }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- Workers Pay -->
          <v-col cols="12" sm="4" class="py-2 py-sm-0">
            <div class="d-flex align-center ga-3">
              <v-icon icon="mdi-account-cash" color="success" size="20"></v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">שולם לעובדים</div>
                <div class="text-subtitle-1 font-weight-bold text-success">
                  ₪{{ formatNumber(props.workersPay) }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- Tips Expenses -->
          <v-col cols="12" sm="4" class="py-2 py-sm-0">
            <div class="d-flex align-center ga-3">
              <v-icon icon="mdi-receipt-text-minus-outline" color="error" size="20"></v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">הוצאות מהטיפ (כולל מע"מ)</div>
                <div class="text-subtitle-1 font-weight-bold text-error">
                  ₪{{ formatNumber(props.expenses) }}
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { formatNumber } from '@shared/utils/formatters.util'

const props = defineProps<{
  totalTips: number
  workersPay: number
  expenses: number
  surplus: number
}>()
</script>

<style scoped>
.surplus-card {
  background: linear-gradient(135deg, rgb(var(--v-theme-surface)) 0%, rgba(255, 193, 7, 0.03) 100%) !important;
  border-color: rgba(255, 193, 7, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.surplus-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 193, 7, 0.08) !important;
  border-color: rgba(255, 193, 7, 0.4) !important;
}

.glow-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 193, 7, 0.04) 0%, transparent 60%);
  pointer-events: none;
}

.z-index-1 {
  position: relative;
  z-index: 1;
}

.avatar-hover-animate {
  transition: transform 0.3s ease;
}

.surplus-card:hover .avatar-hover-animate {
  transform: scale(1.08) rotate(5deg);
}

@media (min-width: 960px) {
  .border-divider {
    border-left: 1px solid rgba(var(--v-border-color), 0.12);
    padding-left: 24px;
  }
}
</style>
