<template>
  <v-container v-if="total > 0" class="pa-0 mb-6">
    <!-- Header Toggle Card -->
    <v-card
      variant="flat"
      class="toggle-header rounded-xl border pa-3 d-flex align-center justify-space-between cursor-pointer transition-all shadow-sm mb-2"
      @click="isOpen = !isOpen"
    >
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-email-multiple-outline" color="primary" />
        <v-icon
          :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="small"
          class="text-medium-emphasis"
        />
      </div>

      <!-- Quick Inline Summary when closed -->
      <v-expand-x-transition>
        <div v-show="!isOpen" class="d-flex align-center ga-3 text-caption text-medium-emphasis">
          <span>סה"כ מעטפות: <strong class="text-primary text-body-2">{{ total }}</strong></span>
          <v-divider vertical class="mx-1" />
          <span>התקבלו: <span class="text-success font-weight-bold">{{ received }}</span></span>
          <v-divider vertical class="mx-1" />
          <span>ממתינות: <span class="text-warning font-weight-bold">{{ pending }}</span></span>
        </div>
      </v-expand-x-transition>
    </v-card>

    <!-- Collapsible Summary Content -->
    <v-expand-transition>
      <div
        v-show="isOpen"
        class="summary-body rounded-xl border pa-4 bg-summary-body mb-2 shadow-sm"
      >
        <v-row dense>
          <!-- Total Card -->
          <v-col cols="4">
            <v-card variant="outlined" class="text-center pa-2 rounded-lg h-100">
              <div class="text-caption text-medium-emphasis mb-1">סה"כ מעטפות</div>
              <div class="text-h6 font-weight-black text-primary">{{ total }}</div>
            </v-card>
          </v-col>

          <!-- Received Card -->
          <v-col cols="4">
            <v-card variant="outlined" class="text-center pa-2 rounded-lg h-100">
              <div class="text-caption text-medium-emphasis mb-1">התקבלו</div>
              <div class="text-h6 font-weight-black text-success">{{ received }}</div>
            </v-card>
          </v-col>

          <!-- Pending Card -->
          <v-col cols="4">
            <v-card variant="outlined" class="text-center pa-2 rounded-lg h-100">
              <div class="text-caption text-medium-emphasis mb-1">ממתינות</div>
              <div class="text-h6 font-weight-black text-warning">{{ pending }}</div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  total: number
  received: number
  pending: number
}>()

const isOpen = ref(false)
</script>

<style scoped>
.toggle-header {
  background: var(--v-theme-surface, #ffffff);
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.toggle-header:hover {
  background: rgba(var(--v-theme-primary), 0.02);
}

.summary-body {
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.bg-summary-body {
  background: rgba(var(--v-theme-primary), 0.01) !important;
}

.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
