<template>
  <v-container v-if="cashiers.length > 0" class="pa-0">
    <!-- List Section Header -->
    <div class="d-flex align-center ga-2 mb-4 px-2">
      <div class="title-indicator rounded-pill" :class="themeClass"></div>
      <h5 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">
        {{ props.tableName }}
      </h5>
      <v-chip size="x-small" variant="flat" :color="themeColor" class="font-weight-bold">
        {{ cashiers.length }} קופות
      </v-chip>
    </div>

    <!-- Cards Grid -->
    <v-row dense>
      <v-col v-for="item in groupedAndSingleCashiers" :key="item.key" cols="12">
        <!-- Render Group Card -->
        <CashierGroupCard
          v-if="item.type === 'group'"
          :group-name="item.groupName"
          :cashiers="item.cashiers"
          :is-select-mode="props.isSelectMode"
          :selected-ids="props.selectedIds"
          @edit="(c) => emit('edit', c)"
          @delete="(c) => emit('delete', c)"
          @receipt="(c) => emit('receipt', c)"
          @select-change="(id, val) => emit('select-change', id, val)"
        />
        <!-- Render Single Cashier Card -->
        <CashierCard
          v-else-if="item.type === 'single'"
          :cashier="item.cashier"
          :index="item.index"
          :is-select-mode="props.isSelectMode"
          :is-selected="props.selectedIds?.includes(item.cashier.id)"
          @edit="(c) => emit('edit', c)"
          @delete="(c) => emit('delete', c)"
          @receipt="(c) => emit('receipt', c)"
          @select-change="(val) => emit('select-change', item.cashier.id, val)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed } from 'vue'

// Import custom components
import CashierCard from '@cashier/components/CashierCard.vue'
import CashierGroupCard from './CashierGroupCard.vue'

// Import stores
import { SessionStore } from '@stores'

// Import types
import { CashierLocation } from '@cashier/types/CashierLocation.types'
import type { ICashier } from '@cashier/types/ICashier.types'

// Define emits
const emit = defineEmits<{
  (e: 'edit', cashier: ICashier): void
  (e: 'delete', cashier: ICashier): void
  (e: 'receipt', cashier: ICashier): void
  (e: 'select-change', id: string, value: boolean): void
}>()

// Define props
const props = defineProps<{
  location: CashierLocation
  tableName: string
  isSelectMode?: boolean
  selectedIds?: string[]
}>()

// Initialize stores
const sessionStore = SessionStore()

// Computed properties
const cashiers = computed<ICashier[]>(() =>
  (sessionStore.cashiers?.data || []).filter((c) => c.location === props.location),
)

const groupedAndSingleCashiers = computed(() => {
  const list = cashiers.value
  const groups: Record<string, ICashier[]> = {}
  const ungrouped: ICashier[] = []

  for (const item of list) {
    if (item.group && item.group.trim()) {
      const gName = item.group.trim()
      if (!groups[gName]) {
        groups[gName] = []
      }
      groups[gName].push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const result: (
    | {
        type: 'group'
        key: string
        groupName: string
        cashiers: ICashier[]
        cashier?: undefined
        index?: undefined
      }
    | {
        type: 'single'
        key: string
        cashier: ICashier
        index: number
        groupName?: undefined
        cashiers?: undefined
      }
  )[] = []

  // Add group cards
  Object.keys(groups).forEach((gName) => {
    const groupCashiers = groups[gName]
    if (groupCashiers) {
      result.push({
        type: 'group',
        key: `group-${gName}`,
        groupName: gName,
        cashiers: groupCashiers,
      })
    }
  })

  // Add single cards
  ungrouped.forEach((item, idx) => {
    result.push({
      type: 'single',
      key: `single-${item.id}`,
      cashier: item,
      index: idx,
    })
  })

  return result
})

// UI theme helper values based on location
const themeColor = computed(() => {
  return props.location === CashierLocation.BAR ? 'primary' : 'teal'
})

const themeClass = computed(() => {
  return props.location === CashierLocation.BAR ? 'bg-primary' : 'bg-teal'
})
</script>

<style scoped>
.title-indicator {
  width: 4px;
  height: 20px;
}
</style>
