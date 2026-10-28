<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <GenericForm
      title="הוספת הוצאה חדשה"
      submit-text="הוסף הוצאה"
      :loading="props.ExpenseCrud.isCreating.value"
      :fields="props.ExpenseCrud.expenseFields"
      :initial-values="props.ExpenseCrud.expenseInitialState(props.sessionId)"
      show-reset
      @submit="handleCreateSubmit"
    >
      <template #amount="{ form, field }">
        <AppInput
          :model-value="form.amount as number"
          @update:model-value="(val) => (form.amount = val !== '' ? Number(val) : 0)"
          :label="field.label"
          type="number"
          v-bind="field.props"
          :rules="field.rules"
        />

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

        <v-card variant="tonal" color="primary" class="rounded-lg overflow-hidden mb-3">
          <v-row dense no-gutters>
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">ללא מע״מ</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithoutVat(form.amount) }}</div>
            </v-col>
            <v-divider vertical />
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">עם מע״מ (18%)</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithVat(form.amount) }}</div>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.ExpenseCrud.selectedItem.value"
      title="עריכת הוצאה"
      submit-text="עדכן הוצאה"
      :loading="props.ExpenseCrud.isUpdating.value"
      :fields="props.ExpenseCrud.expenseFields"
      :initial-values="updateInitial as IUpdateExpense"
      show-cancel
      @submit="handleUpdateSubmit"
      @cancel="updateOpen = false"
    >
      <template #amount="{ form, field }">
        <AppInput
          :model-value="form.amount as number"
          @update:model-value="(val) => (form.amount = val !== '' ? Number(val) : 0)"
          :label="field.label"
          type="number"
          v-bind="field.props"
          :rules="field.rules"
        />

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

        <v-card variant="tonal" color="primary" class="rounded-lg overflow-hidden mb-3">
          <v-row dense no-gutters>
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">ללא מע״מ</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithoutVat(form.amount) }}</div>
            </v-col>
            <v-divider vertical />
            <v-col cols="6" class="text-center pa-3">
              <div class="text-caption text-medium-emphasis mb-1">עם מע״מ (18%)</div>
              <div class="text-h5 font-weight-bold">₪{{ priceWithVat(form.amount) }}</div>
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
    title="מחיקת הוצאה"
    :item-name="props.ExpenseCrud.selectedItem.value?.name || ''"
    :loading="props.ExpenseCrud.isDeleting.value"
    @confirm="props.ExpenseCrud.handleDelete"
    @cancel="deleteOpen = false"
  />

  <!-- Receipt Dialog -->
  <receipt-dialog
    v-model="receiptOpen"
    :title="'ניהול קבלה להוצאה'"
    :receipt-url="props.ExpenseCrud.receiptItem.value?.receiptUrl"
    :loading="props.ExpenseCrud.isProcessingReceipt.value"
    @upload="props.ExpenseCrud.handleReceiptUpload"
    @remove="props.ExpenseCrud.handleReceiptRemove"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Import components
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import ReceiptDialog from '@shared/components/dialogs/ReceiptDialog.vue'
import AppInput from '@shared/components/input/AppInput.vue'

// Import types and composables
import { useExpenseCrud } from '@expense/composables/expense.crud'
import type { ICreateExpense, IUpdateExpense } from '@expense/types/IExpense.types'
import type { FormValue } from '@shared/types/IForm.types'
import { addVat, removeVat } from '@shared/utils/vat.util'

const props = defineProps<{
  ExpenseCrud: ReturnType<typeof useExpenseCrud>
  sessionId: string
}>()

// Model bindings for two-way bindings
const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })
const receiptOpen = defineModel<boolean>('receiptOpen', { default: false })

// VAT toggle logic
const includesVat = ref(false)

watch([createOpen, updateOpen], ([createOpened, updateOpened]) => {
  if (createOpened || updateOpened) {
    includesVat.value = false
  }
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

// Rounded initial values for the update form
const updateInitial = computed(() =>
  props.ExpenseCrud.selectedItem.value
    ? {
        ...props.ExpenseCrud.selectedItem.value,
        amount: Number((props.ExpenseCrud.selectedItem.value.amount ?? 0).toFixed(2)),
      }
    : null,
)

// Form submit handlers
const handleCreateSubmit = (form: ICreateExpense) => {
  let amount = Number(form.amount ?? 0)
  if (includesVat.value) {
    amount = removeVat(amount)
  }
  props.ExpenseCrud.handleCreate({
    ...form,
    amount,
  })
}

const handleUpdateSubmit = (form: IUpdateExpense) => {
  let amount = form.amount !== undefined ? Number(form.amount) : undefined
  if (amount !== undefined && includesVat.value) {
    amount = removeVat(amount)
  }
  const selectedItem = props.ExpenseCrud.selectedItem.value
  if (!selectedItem) return
  props.ExpenseCrud.handleUpdate({
    ...form,
    id: selectedItem.id,
    timestamp: selectedItem.timestamp,
    amount,
  })
}
</script>
