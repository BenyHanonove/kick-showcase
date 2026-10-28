<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <GenericForm
      title="יצירת צריכה חדשה"
      submit-text="שמור צריכה"
      :loading="props.ConsumeCrud.isCreating.value"
      :fields="props.ConsumeCrud.getCreateFields(props.showPricesAndOrder, props.isAdmin)"
      :initial-values="props.ConsumeCrud.consumeInitialState(props.sessionId)"
      show-reset
      @submit="handleCreateSubmit"
    >
      <template #productId="{ form }">
        <v-autocomplete
          :model-value="form.productId"
          label="מוצר*"
          :items="props.availableProducts"
          :item-title="(item) => (item ? item.name : '')"
          item-value="id"
          variant="outlined"
          density="comfortable"
          :rules="[(v: FormValue) => !!v || 'חובה']"
          @update:model-value="(val) => onProductSelect(form as object as ICreateConsume, val)"
        />
      </template>

      <template #priceSummary="{ form }">
        <v-btn-toggle
          v-model="includesVat"
          mandatory
          density="compact"
          rounded="lg"
          color="primary"
          class="w-100 mb-3"
        >
          <v-btn :value="false" class="flex-1-1">ללא מע״מ</v-btn>
          <v-btn :value="true" class="flex-1-1">כולל מע״מ</v-btn>
        </v-btn-toggle>

        <v-card variant="tonal" color="primary" class="rounded-lg overflow-hidden">
          <v-row dense no-gutters>
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">ללא מע״מ</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithoutVat(form.chargedPrice) }}</div>
            </v-col>
            <v-divider vertical />
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">עם מע״מ (18%)</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithVat(form.chargedPrice) }}</div>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.ConsumeCrud.selectedItem.value"
      title="עריכת צריכה"
      submit-text="עדכן צריכה"
      :loading="props.ConsumeCrud.isUpdating.value"
      :fields="props.ConsumeCrud.getUpdateFields(props.showPricesAndOrder, props.isAdmin)"
      :initial-values="updateInitial as IUpdateConsume"
      show-cancel
      @submit="handleUpdateSubmit"
      @cancel="updateOpen = false"
    >
      <template #productId="{ form }">
        <v-autocomplete
          :model-value="form.productId"
          label="מוצר*"
          :items="props.availableProducts"
          :item-title="(item) => (item ? item.name : '')"
          item-value="id"
          variant="outlined"
          density="comfortable"
          :rules="[(v: FormValue) => !!v || 'חובה']"
          @update:model-value="(val) => onProductSelect(form as object as ICreateConsume, val)"
        />
      </template>

      <template #priceSummary="{ form }">
        <v-btn-toggle
          v-model="includesVat"
          mandatory
          density="compact"
          rounded="lg"
          color="primary"
          class="w-100 mb-3"
        >
          <v-btn :value="false" class="flex-1-1">ללא מע״מ</v-btn>
          <v-btn :value="true" class="flex-1-1">כולל מע״מ</v-btn>
        </v-btn-toggle>

        <v-card variant="tonal" color="primary" class="rounded-lg overflow-hidden">
          <v-row dense no-gutters>
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">ללא מע״מ</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithoutVat(form.chargedPrice) }}</div>
            </v-col>
            <v-divider vertical />
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">עם מע״מ (18%)</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithVat(form.chargedPrice) }}</div>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Delete Dialog -->
  <AppDialog
    v-model="deleteOpen"
    type="delete"
    title="מחיקת צריכה"
    item-name="מוצר זה"
    :loading="props.ConsumeCrud.isDeleting.value"
    @confirm="props.ConsumeCrud.handleDelete"
    @cancel="deleteOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'

import type { ICreateConsume, IUpdateConsume } from '@consume/types/IConsume.types'
import type { FormValue } from '@shared/types/IForm.types'
import { useConsumeCrud } from '@consume/composables/consume.crud'
import type { IProduct } from '@product/types/IProduct.types'
import { addVat, removeVat } from '@shared/utils/vat.util'

const props = defineProps<{
  ConsumeCrud: ReturnType<typeof useConsumeCrud>
  sessionId: string
  showPricesAndOrder: boolean
  isAdmin: boolean
  availableProducts: IProduct[] | undefined
}>()

// Model bindings for two-way bindings
const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })

// Product selection logic helper
const onProductSelect = (form: ICreateConsume, productId: FormValue) => {
  if (typeof productId === 'string') {
    form.productId = productId
    const product = props.availableProducts?.find((p) => p.id === productId)
    if (product) {
      form.chargedPrice = product.price
      form.supplierPrice = product.price
    }
  }
}

// Rounded initial values for the update form
const updateInitial = computed(() =>
  props.ConsumeCrud.selectedItem.value
    ? {
        ...props.ConsumeCrud.selectedItem.value,
        chargedPrice: Number((props.ConsumeCrud.selectedItem.value.chargedPrice ?? 0).toFixed(2)),
        supplierPrice: Number((props.ConsumeCrud.selectedItem.value.supplierPrice ?? 0).toFixed(2)),
      }
    : null,
)

// VAT toggle logic
const includesVat = ref(false)
watch(updateOpen, (open) => {
  if (open) includesVat.value = false
})

const priceWithoutVat = (price: FormValue) => {
  const value =
    typeof price === 'number' ? price : typeof price === 'string' ? Number(price) || 0 : 0
  return includesVat.value ? removeVat(value).toFixed(2) : value.toFixed(2)
}

const priceWithVat = (price: FormValue) => {
  const value =
    typeof price === 'number' ? price : typeof price === 'string' ? Number(price) || 0 : 0
  return includesVat.value ? value.toFixed(2) : addVat(value).toFixed(2)
}

// Form submit handlers
const handleCreateSubmit = (form: ICreateConsume) => {
  props.ConsumeCrud.handleCreate({
    ...form,
    chargedPrice: Number(form.chargedPrice ?? 0),
    supplierPrice: Number(form.supplierPrice ?? 0),
    target: Number(form.target ?? 0),
    order: Number(form.order ?? 0),
    arrived: Number(form.arrived ?? 0),
    fromStorage: Number(form.fromStorage ?? 0),
    creditedToSupplier: Number(form.creditedToSupplier ?? 0),
    returnedToStorage: Number(form.returnedToStorage ?? 0),
  })
}

const handleUpdateSubmit = (form: IUpdateConsume) => {
  let chargedPrice = form.chargedPrice !== undefined ? Number(form.chargedPrice) : undefined
  if (chargedPrice !== undefined && props.showPricesAndOrder && includesVat.value) {
    chargedPrice = removeVat(chargedPrice)
  }
  const selectedItem = props.ConsumeCrud.selectedItem.value
  if (!selectedItem) return
  props.ConsumeCrud.handleUpdate({
    id: selectedItem.id,
    timestamp: selectedItem.timestamp,
    chargedPrice,
    supplierPrice: form.supplierPrice !== undefined ? Number(form.supplierPrice) : undefined,
    target: form.target !== undefined ? Number(form.target) : undefined,
    order: form.order !== undefined ? Number(form.order) : undefined,
    arrived: form.arrived !== undefined ? Number(form.arrived) : undefined,
    fromStorage: form.fromStorage !== undefined ? Number(form.fromStorage) : undefined,
    creditedToSupplier:
      form.creditedToSupplier !== undefined ? Number(form.creditedToSupplier) : undefined,
    returnedToStorage:
      form.returnedToStorage !== undefined ? Number(form.returnedToStorage) : undefined,
  })
}
</script>
