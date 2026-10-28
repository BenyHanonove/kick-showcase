<template>
  <v-container class="pa-0">
    <h5 class="text-h6 font-weight-bold mb-4 px-2">ריכוז טיפים</h5>

    <v-row dense>
      <v-col v-for="item in props.tipsList" :key="item.id" cols="12">
        <TipsCard :tips="item" @edit="(t) => emit('edit', t)" />
      </v-col>

      <v-col v-if="props.tipsList.length > 0" cols="12">
        <v-card variant="flat" color="surface-light" class="rounded-lg pa-4 border-dashed">
          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-2 font-weight-bold">סה"כ טיפים:</span>
            <div class="text-h6 font-weight-black text-primary">₪{{ totalTips }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Import custom components
import TipsCard from '@tips/components/TipsCard.vue'

// Import types
import type { ITips } from '@tips/types/ITips.types'

// Define props
const props = defineProps<{
  tipsList: ITips[]
}>()

// Define emits
const emit = defineEmits<{
  (e: 'edit', tips: ITips): void
}>()

// Calculate total
const totalTips = computed(() => {
  return props.tipsList.reduce((acc, curr) => acc + curr.cashTip + curr.creditTip, 0)
})
</script>
