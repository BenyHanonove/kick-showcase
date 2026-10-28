<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <GenericForm
      title="יצירת מוצר חדש"
      submit-text="צור מוצר"
      :loading="props.ProductCrud.isCreating.value"
      :fields="createFields"
      :initial-values="createInitialValues"
      show-reset
      @submit="handleCreateSubmit"
      @update:form="(f) => (createFormType = (f as ICreateProduct).type)"
    >
      <template #price="{ field, form }">
        <div class="d-flex align-stretch ga-2">
          <AppInput
            type="number"
            :model-value="form.price as number"
            @update:model-value="(val) => (form.price = Number(val))"
            :label="field.label"
            v-bind="field.props"
            :rules="field.rules"
            class="flex-grow-1"
            style="flex-basis: 75%"
            hide-details="auto"
          />
          <v-chip
            color="success"
            variant="tonal"
            class="flex-grow-0 rounded-lg justify-center px-2"
            style="flex-basis: 25%; height: 56px"
          >
            <div class="d-flex flex-column align-center text-caption" style="line-height: 1.2">
              <span>כולל מע"מ</span>
              <span>₪{{ addVat(Number(form.price) || 0) }}</span>
            </div>
          </v-chip>
        </div>
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.ProductCrud.selectedItem.value"
      title="עריכת מוצר"
      submit-text="עדכן מוצר"
      :loading="props.ProductCrud.isUpdating.value"
      :fields="updateFields"
      :initial-values="props.ProductCrud.selectedItem.value"
      show-cancel
      @submit="handleUpdateSubmit"
      @cancel="updateOpen = false"
      @update:form="(f) => (updateFormType = (f as IUpdateProduct).type)"
    >
      <template #price="{ field, form }">
        <div class="d-flex align-stretch ga-2">
          <AppInput
            type="number"
            :model-value="form.price as number"
            @update:model-value="(val) => (form.price = Number(val))"
            :label="field.label"
            v-bind="field.props"
            :rules="field.rules"
            class="flex-grow-1"
            style="flex-basis: 75%"
            hide-details="auto"
          />
          <v-chip
            color="success"
            variant="tonal"
            class="flex-grow-0 rounded-lg justify-center px-2"
            style="flex-basis: 25%; height: 56px"
          >
            <div class="d-flex flex-column align-center text-caption" style="line-height: 1.2">
              <span>כולל מע"מ</span>
              <span>₪{{ addVat(Number(form.price) || 0) }}</span>
            </div>
          </v-chip>
        </div>
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Delete Dialog -->
  <AppDialog
    v-model="deleteOpen"
    type="delete"
    title="מחיקת מוצר"
    :item-name="props.ProductCrud.selectedItem.value?.name || ''"
    :loading="props.ProductCrud.isDeleting.value"
    @confirm="props.ProductCrud.handleDelete"
    @cancel="deleteOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppInput from '@shared/components/input/AppInput.vue'

import { ProductType } from '@product/types/ProductType.types'
import type { ICreateProduct, IUpdateProduct } from '@product/types/IProduct.types'
import { useProductCrud } from '@product/composables/product.crud'
import type { ISupplier } from '@supplier/types/ISupplier.types'
import { addVat } from '@shared/utils/vat.util'

const props = defineProps<{
  ProductCrud: ReturnType<typeof useProductCrud>
  suppliers: ISupplier[]
  isEquipmentMode: boolean
  activeTab: string
}>()

// Model bindings
const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })

const createFormType = ref<ICreateProduct['type'] | undefined>(undefined)
const updateFormType = ref<IUpdateProduct['type'] | undefined>(undefined)

// Stable initial values prevent form reset on re-render
const createInitialValues = computed(() =>
  props.ProductCrud.productInitialState(props.isEquipmentMode),
)

// Fields recompute as the selected product type changes within each form.
const createFields = computed(() =>
  props.ProductCrud.getProductFields(
    props.suppliers || [],
    { type: createFormType.value },
    props.isEquipmentMode,
  ),
)
const updateFields = computed(() =>
  props.ProductCrud.getProductFields(
    props.suppliers || [],
    { type: updateFormType.value },
    props.isEquipmentMode,
  ),
)

// In equipment mode the type/volume are forced from the active tab.
const withEquipmentDefaults = <T extends object>(formData: T): T => {
  if (!props.isEquipmentMode) return formData
  const targetType =
    props.activeTab === ProductType.DISPOSABLE ? ProductType.DISPOSABLE : ProductType.EQUIPMENT
  return { ...formData, type: targetType, volume: 1 }
}

const handleCreateSubmit = (formData: ICreateProduct) => {
  props.ProductCrud.handleCreate(withEquipmentDefaults(formData))
}

const handleUpdateSubmit = (formData: IUpdateProduct) => {
  props.ProductCrud.handleUpdate(withEquipmentDefaults(formData))
}
</script>
