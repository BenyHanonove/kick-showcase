<template>
  <v-row no-gutters class="align-center py-3 px-4 border-b transition-swing">
    <v-col cols="12" sm="6" class="d-flex flex-column mb-2 mb-sm-0">
      <span class="font-weight-bold text-body-1">{{ product.name }}</span>
      <span class="text-caption text-medium-emphasis">
        <v-icon size="x-small" icon="mdi-truck-outline" class="me-1" />
        {{ supplierName }}
      </span>
    </v-col>

    <v-col cols="12" sm="6" class="d-flex justify-end align-center">
      <div class="d-flex align-center border rounded-pill pa-1">
        <AppButton
          icon="mdi-minus"
          size="32"
          variant="text"
          color="grey-darken-2"
          @click="decrement"
          :disabled="quantity <= 0"
        />

        <v-text-field
          v-model.number="quantity"
          type="number"
          variant="plain"
          hide-details
          flat
          density="compact"
          class="centered-input font-weight-black quantity-input"
          @focus="$event.target.select()"
        />

        <AppButton icon="mdi-plus" size="32" variant="tonal" color="secondary" @click="increment" />
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SuppliersStore } from '@stores'
import type { IProduct } from '@product/types/IProduct.types'

const props = defineProps<{
  product: IProduct
}>()

const suppliersStore = SuppliersStore()

// Local quantity state, initialized to product's current quantity
const quantity = ref(props.product.quantity || 0)

watch(
  () => props.product.quantity,
  (newVal) => {
    quantity.value = newVal || 0
  },
)

const supplierName = computed(() => {
  if (props.product.supplierId === 'no-supplier') return 'ללא ספק'
  const supplier = suppliersStore.get(props.product.supplierId)
  return supplier ? supplier.name : 'ספק לא ידוע'
})

const decrement = () => {
  if (quantity.value > 0) quantity.value--
}

const increment = () => {
  quantity.value++
}

const getSubmitData = () => {
  return {
    id: props.product.id,
    quantity: quantity.value,
  }
}

defineExpose({ getSubmitData })
</script>

<style scoped>
.centered-input :deep(input) {
  text-align: center;
  padding: 0;
  font-size: 1.1rem;
}

.centered-input :deep(input::-webkit-outer-spin-button),
.centered-input :deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.transition-swing {
  transition: background-color 0.2s ease-in-out;
}

.quantity-input {
  width: 50px;
}
</style>
