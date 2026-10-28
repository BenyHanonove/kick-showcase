<template>
  <v-container class="pb-24">
    <v-card variant="flat" border class="rounded-lg">
      <v-list class="pa-0">
        <template v-slot:default>
          <template v-for="group in groupedItems" :key="group.type">
            <v-list-subheader class="text-secondary font-weight-black text-subtitle-1 py-4">
              {{ group.label }}
            </v-list-subheader>

            <template v-for="item in group.items" :key="item.id">
              <consume-bulk-item
                v-if="getProduct(item.productId)"
                ref="itemRefs"
                :product="getProduct(item.productId)!"
                :consume-id="item.id"
                :initial-value="item[targetField]"
                :target-field="targetField"
                :secondary-field="secondaryField"
                :secondary-initial-value="secondaryField ? item[secondaryField] : 0"
                :primary-label="primaryLabel"
                :secondary-label="secondaryLabel"
                :reference-field="referenceField"
                :reference-value="referenceField ? item[referenceField] : undefined"
                :reference-label="referenceLabel"
                :session-id="sessionId"
                :basic="basic"
              />
            </template>
            <v-divider />
          </template>
        </template>
      </v-list>
    </v-card>
  </v-container>

  <!-- Sticky save button — teleported to body to escape v-main overflow -->
  <Teleport to="body">
    <div class="sticky-save-wrapper">
      <div class="pa-4 sticky-save-panel">
        <AppButton block size="large" color="secondary" class="sticky-save-btn" :loading="loading" @click="handleSubmit">
          {{ btnLabel || 'עדכן הכל' }}
        </AppButton>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Import custom components
import ConsumeBulkItem from './ConsumeBulkItem.vue'

// Import stores
import { ProductsStore } from '@stores'

// Import types
import type { IConsume } from '@consume/types/IConsume.types'
import { ProductType, ProductTypeLabels } from '@product/types/ProductType.types'

// Define emits
const emit = defineEmits(['submit'])

// Define props
const props = defineProps<{
  items: IConsume[]
  targetField:
    | 'target'
    | 'order'
    | 'arrived'
    | 'fromStorage'
    | 'creditedToSupplier'
    | 'returnedToStorage'
  sessionId: string
  types?: ProductType[]
  loading?: boolean
  btnLabel?: string
  // Optional secondary counter alongside the primary one
  secondaryField?:
    | 'target'
    | 'order'
    | 'arrived'
    | 'fromStorage'
    | 'creditedToSupplier'
    | 'returnedToStorage'
  primaryLabel?: string
  secondaryLabel?: string
  // Optional read-only reference counter shown alongside the row
  referenceField?:
    | 'target'
    | 'order'
    | 'arrived'
    | 'fromStorage'
    | 'creditedToSupplier'
    | 'returnedToStorage'
  referenceLabel?: string
  // When true, hides the reference and secondary counter boxes (e.g. sale bulk screens)
  basic?: boolean
}>()

// Init stores
const productStore = ProductsStore()

// Reactive state
const itemRefs = ref<{ getSubmitData: () => IConsume }[]>([])

// Computed properties
const groupedItems = computed(() => {
  const typesToUse =
    props.types && props.types.length > 0 ? props.types : Object.values(ProductType)

  const groups = typesToUse.map((type) => {
    return {
      type,
      label: ProductTypeLabels[type] || type,
      items: props.items.filter((item) => getProduct(item.productId)?.type === type),
    }
  })

  return groups.filter((group) => group.items.length > 0)
})

// Helper methods
const getProduct = (productId: string) => {
  return (productStore.products || []).find((p) => p.id === productId)
}

// Handle submission
const handleSubmit = () => {
  const payload = itemRefs.value.map((child) => child.getSubmitData())
  emit('submit', payload)
}
</script>

<style scoped>
/* Sticky save bar — teleported to body to escape v-main overflow */
.sticky-save-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none;
  /* Fades from the page background into transparent, no hard edge */
  padding-top: 32px;
  background: linear-gradient(
    to top,
    rgb(var(--v-theme-background)) 60%,
    rgba(var(--v-theme-background), 0)
  );
}

.sticky-save-panel {
  width: 100%;
  max-width: 600px;
  pointer-events: auto;
}
</style>
