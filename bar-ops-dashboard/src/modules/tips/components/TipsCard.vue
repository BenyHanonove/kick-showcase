<template>
  <v-card variant="outlined" class="rounded-lg pa-4 bg-card shadow-sm mb-3">
    <div class="d-flex justify-space-between align-start mb-4">
      <div>
        <div class="text-h6 font-weight-bold">
          <span v-if="props.tips.area === ServiceArea.BAR">טיפים בר</span>
          <span v-else-if="props.tips.area === ServiceArea.TABLES">טיפים שולחנות</span>
        </div>
        <div class="text-caption text-medium-emphasis">פירוט טיפים למשמרת</div>
      </div>

      <v-chip size="small" variant="flat" color="success" class="font-weight-bold">
        ₪{{ props.tips.cashTip + props.tips.creditTip }}
      </v-chip>
    </div>

    <v-divider class="mb-4" />

    <div class="d-flex justify-space-between align-center">
      <div class="d-flex ga-2">
        <v-chip size="x-small" variant="tonal" color="success"
          >מזומן: ₪{{ props.tips.cashTip }}</v-chip
        >
        <v-chip size="x-small" variant="tonal" color="info"
          >אשראי: ₪{{ props.tips.creditTip }}</v-chip
        >
        <v-chip size="x-small" variant="tonal" color="warning"
          >שעתי ראנר: ₪{{ props.tips.runnerFeed }}</v-chip
        >
      </div>

      <AppButton
        icon="mdi-pencil"
        variant="tonal"
        size="x-small"
        color="primary"
        @click="emit('edit', props.tips)"
      />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { ITips } from '@tips/types/ITips.types'
import { ServiceArea } from '@tips/types/ServiceArea.types'

const props = defineProps<{
  tips: ITips
}>()

const emit = defineEmits<{
  (e: 'edit', tips: ITips): void
}>()
</script>
