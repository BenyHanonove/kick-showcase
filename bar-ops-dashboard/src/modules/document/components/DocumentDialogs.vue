<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <GenericForm
      title="העלאת מסמך חדש"
      submit-text="העלה מסמך"
      :loading="props.DocumentCrud.isCreating.value"
      :fields="props.DocumentCrud.documentCreateFields"
      :initial-values="props.DocumentCrud.documentInitialState(props.sessionId)"
      show-reset
      @submit="handleCreateSubmit"
    >
      <template #desc="{ form, field }">
        <AppInput
          :model-value="selectedFile"
          @update:model-value="(val) => (selectedFile = (val as File | null))"
          label="קובץ*"
          type="file"
          class="mb-3"
        />

        <AppInput
          :model-value="form.desc as string"
          @update:model-value="(val) => (form.desc = val as string)"
          :label="field.label"
          type="textarea"
          :rules="field.rules"
        />
      </template>
    </GenericForm>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.DocumentCrud.selectedItem.value"
      title="עריכת מסמך"
      submit-text="עדכן מסמך"
      :loading="props.DocumentCrud.isUpdating.value"
      :fields="props.DocumentCrud.documentUpdateFields"
      :initial-values="props.DocumentCrud.selectedItem.value as IUpdateDocument"
      show-cancel
      @submit="handleUpdateSubmit"
      @cancel="updateOpen = false"
    />
  </AppDialog>

  <!-- Delete Dialog -->
  <AppDialog
    v-model="deleteOpen"
    type="delete"
    title="מחיקת מסמך"
    :item-name="props.DocumentCrud.selectedItem.value?.name || ''"
    :loading="props.DocumentCrud.isDeleting.value"
    @confirm="props.DocumentCrud.handleDelete"
    @cancel="deleteOpen = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Import components
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppInput from '@shared/components/input/AppInput.vue'

// Import stores
import { SnackbarStore } from '@stores'

// Import types and composables
import { useDocumentCrud } from '@document/composables/document.crud'
import type { IUpdateDocument } from '@document/types/IDocument.types'

const props = defineProps<{
  DocumentCrud: ReturnType<typeof useDocumentCrud>
  sessionId: string
}>()

// Model bindings for two-way bindings
const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })

// File picked outside GenericForm's field pipeline (no 'file' FormFieldType)
const selectedFile = ref<File | null>(null)

const snackbarStore = SnackbarStore()

// Form submit handlers
const handleCreateSubmit = (form: { sessionId: string; desc?: string }) => {
  if (!selectedFile.value) {
    snackbarStore.open('יש לבחור קובץ להעלאה', 'error')
    return
  }
  props.DocumentCrud.handleUpload(selectedFile.value, {
    sessionId: props.sessionId,
    desc: form.desc,
  }).then(() => {
    selectedFile.value = null
  })
}

const handleUpdateSubmit = (form: IUpdateDocument) => {
  const selectedItem = props.DocumentCrud.selectedItem.value
  if (!selectedItem) return
  props.DocumentCrud.handleUpdate({
    ...form,
    id: selectedItem.id,
    timestamp: selectedItem.timestamp,
  })
}
</script>
