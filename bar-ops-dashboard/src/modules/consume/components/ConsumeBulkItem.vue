<template>
  <v-row no-gutters class="align-start py-3 px-4 border-b transition-swing">
    <!-- Product info: supplier, name and price -->
    <v-col cols="7" sm="7" class="d-flex flex-column">
      <div class="d-flex align-center">
        <InitialsAvatar
          v-if="supplier"
          :name="supplier.name"
          color="primary"
          size="28"
          class="elevation-1"
        >
          <v-tooltip activator="parent" location="top">{{ supplier.name }}</v-tooltip>
        </InitialsAvatar>
        <v-icon v-else size="x-small" icon="mdi-truck-outline" />
        <span class="font-weight-bold text-body-1 ms-4">{{ product.name }}</span>
      </div>

      <auth-wrapper v-if="showPricesAndOrder" :level="UserRole.ADMIN">
        <div class="d-flex align-center flex-wrap ga-2 mt-1">
          <span class="text-body-1 font-weight-black text-primary">
            ₪{{ (product.price ?? 0).toFixed(2) }}
          </span>
          <span class="text-caption text-medium-emphasis">
            · ₪{{ addVat(product.price ?? 0).toFixed(2) }} כולל מע״מ
          </span>
        </div>
      </auth-wrapper>
    </v-col>

    <v-col cols="5" sm="5" class="d-flex flex-column align-end ga-2">
      <!-- Primary counter (e.g. ספק / order). Hidden for equipment on the
           supplier-order field — equipment isn't ordered from a supplier. -->
      <div v-if="showPrimaryCounter" class="d-flex flex-column align-center">
        <span v-if="secondaryField" class="text-caption text-medium-emphasis font-weight-bold mb-1">
          {{ primaryLabel }}
        </span>
        <div class="d-flex flex-column flex-sm-row align-center ga-2">
          <!-- Reference counter: read-only, shows another field's value for context -->
          <v-chip
            v-if="referenceField && !basic"
            size="small"
            variant="tonal"
            color="grey-darken-1"
            class="font-weight-bold"
          >
            {{ referenceLabel }}: {{ referenceValue }}
          </v-chip>

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

            <AppButton
              icon="mdi-plus"
              size="32"
              variant="tonal"
              color="secondary"
              @click="increment"
            />
          </div>
        </div>
      </div>

      <!-- Secondary counter (e.g. מחסן / fromStorage) -->
      <div v-if="secondaryField && !basic" class="d-flex flex-column align-center">
        <span class="text-caption text-medium-emphasis font-weight-bold mb-1">
          {{ secondaryLabel }}
        </span>
        <div class="d-flex align-center border rounded-pill pa-1">
          <AppButton
            icon="mdi-minus"
            size="32"
            variant="text"
            color="grey-darken-2"
            @click="decrementSecondary"
            :disabled="secondaryQuantity <= 0"
          />

          <v-text-field
            v-model.number="secondaryQuantity"
            type="number"
            variant="plain"
            hide-details
            flat
            density="compact"
            class="centered-input font-weight-black quantity-input"
            @focus="$event.target.select()"
          />

          <AppButton
            icon="mdi-plus"
            size="32"
            variant="tonal"
            color="secondary"
            @click="incrementSecondary"
          />
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AuthWrapper from '@auth/components/AuthWrapper.vue'
import InitialsAvatar from '@shared/components/layout/InitialsAvatar.vue'

import { SuppliersStore } from '@stores'

import { addVat } from '@shared/utils/vat.util'

import type { IProduct } from '@product/types/IProduct.types'
import { ProductType } from '@product/types/ProductType.types'
import { UserRole } from '@auth/types/IUser.types'

const props = withDefaults(
  defineProps<{
    sessionId: string
    product: IProduct
    targetField:
      | 'target'
      | 'order'
      | 'arrived'
      | 'fromStorage'
      | 'creditedToSupplier'
      | 'returnedToStorage'
    initialValue?: number
    consumeId?: string
    // Optional secondary +/- counter (e.g. fromStorage)
    secondaryField?:
      | 'target'
      | 'order'
      | 'arrived'
      | 'fromStorage'
      | 'creditedToSupplier'
      | 'returnedToStorage'
    secondaryInitialValue?: number
    primaryLabel?: string
    secondaryLabel?: string
    // Read-only reference counter (e.g. "יעד: 20") shown for context only
    referenceField?:
      | 'target'
      | 'order'
      | 'arrived'
      | 'fromStorage'
      | 'creditedToSupplier'
      | 'returnedToStorage'
    referenceValue?: number
    referenceLabel?: string
    // When true, hides the reference and secondary counter boxes (e.g. sale bulk screens)
    basic?: boolean
  }>(),
  {
    initialValue: 0,
    secondaryInitialValue: 0,
    primaryLabel: '',
    secondaryLabel: '',
    referenceValue: 0,
    referenceLabel: '',
    basic: false,
  },
)

// Init stores
const suppliersStore = SuppliersStore()

const quantity = ref(props.initialValue || 0)
const secondaryQuantity = ref(props.secondaryInitialValue || 0)

// Watch initialValue and update quantity
watch(
  () => props.initialValue,
  (newVal) => {
    quantity.value = newVal || 0
  },
)

// Watch secondaryInitialValue and update secondaryQuantity
watch(
  () => props.secondaryInitialValue,
  (newVal) => {
    secondaryQuantity.value = newVal || 0
  },
)

const showPricesAndOrder = computed(() => {
  const type = props.product.type
  return type !== ProductType.EQUIPMENT
})

// Hide order counter for equipment products
const showPrimaryCounter = computed(
  () => !(props.targetField === 'order' && props.product.type === ProductType.EQUIPMENT),
)
const supplier = computed(() => suppliersStore.get(props.product.supplierId))

// Decrement quantity
const decrement = () => {
  if (quantity.value > 0) quantity.value--
}

// Increment quantity
const increment = () => quantity.value++

// Secondary counter handlers
const decrementSecondary = () => {
  if (secondaryQuantity.value > 0) secondaryQuantity.value--
}
const incrementSecondary = () => secondaryQuantity.value++

// Get submit data
const getSubmitData = () => {
  return {
    id: props.consumeId,
    productId: props.product.id,
    sessionId: props.sessionId,
    chargedPrice: props.product.price,
    supplierPrice: props.product.price,
    [props.targetField]: quantity.value,
    ...(props.secondaryField ? { [props.secondaryField]: secondaryQuantity.value } : {}),
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

:deep(.v-avatar) {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  );
}
</style>
