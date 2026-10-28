<template>
  <v-container class="pa-0">
    <!-- List Section Header -->
    <div class="d-flex align-center ga-2 mb-4 px-2">
      <div class="title-indicator rounded-pill bg-error"></div>
      <h5 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0">הוצאות</h5>
      <v-chip size="x-small" variant="flat" color="error" class="font-weight-bold">
        {{ expenses.length }} הוצאות
      </v-chip>
    </div>

    <!-- Cards Grid -->
    <v-row dense>
      <v-col v-for="(item, index) in expenses" :key="item.id || index" cols="12">
        <ExpenseCard
          :expense="item"
          :index="index"
          @edit="(e) => emit('edit', e)"
          @delete="(e) => emit('delete', e)"
          @receipt="(e) => emit('receipt', e)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed } from 'vue'

// Import custom components
import ExpenseCard from '@expense/components/ExpenseCard.vue'

// Import types
import type { IExpense } from '@expense/types/IExpense.types'

// Import stores
import { SessionStore } from '@stores'

// Initialize stores
const sessionStore = SessionStore()

// Computed properties
const expenses = computed(() => sessionStore.expenses?.data || [])

// Define emits
const emit = defineEmits<{
  (e: 'edit', expense: IExpense): void
  (e: 'delete', expense: IExpense): void
  (e: 'receipt', expense: IExpense): void
}>()
</script>

<style scoped>
.title-indicator {
  width: 4px;
  height: 20px;
}
</style>
