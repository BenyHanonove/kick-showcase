<template>
  <v-container v-if="consumes.length > 0" class="pa-0">
    <div v-for="(group, type) in groupedConsumes" :key="type">
      <v-list-subheader class="text-h6 font-weight-bold text-primary mt-4 d-flex align-center">
        {{ group.label }}
      </v-list-subheader>

      <v-divider class="mb-4" />

      <consume-row
        v-for="item in group.items"
        :key="item.id"
        :consume="item"
        :basic="basic"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @quick-update="emit('quick-update', $event)"
      />
    </div>
  </v-container>

  <v-sheet v-else class="pa-12 text-center" rounded="lg">
    <v-icon icon="mdi-basket-outline" size="64" color="grey-lighten-1" class="mb-4" />
    <div class="text-h6 text-grey">אין נתוני צריכה להצגה</div>
  </v-sheet>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed } from 'vue'

// Import custom components
import ConsumeRow from '@consume/components/ConsumeRow.vue'

// Import stores
import { ProductsStore } from '@stores'

// Import types
import type { IConsume } from '@consume/types/IConsume.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'

// Define emits
const emit = defineEmits(['edit', 'delete', 'quick-update'])

// Define props
const props = defineProps<{
  consumes: IConsume[]
  types: ProductType[]
  basic?: boolean
}>()

// Active stores
const productsStore = ProductsStore()

// Computed properties
const groupedConsumes = computed(() => {
  const groups: Record<string, { label: string; items: IConsume[] }> = {}

  props.types.forEach((type) => {
    groups[type] = {
      label: ProductTypeLabels[type] || 'כללי',
      items: props.consumes.filter((c) => productsStore.get(c.productId)?.type === type),
    }
  })

  // Filter out empty groups
  return Object.fromEntries(Object.entries(groups).filter(([, group]) => group.items.length > 0))
})
</script>
