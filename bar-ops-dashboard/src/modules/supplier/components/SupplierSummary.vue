<template>
  <v-card class="pa-2 rounded-lg mx-auto" width="100%" max-width="400">
    <v-card-title class="text-h5 font-weight-bold pa-4"> סיכום ספק </v-card-title>

    <v-form ref="formRef" v-model="isValid" @submit.prevent="submit">
      <v-card-text class="d-flex flex-column ga-2">
        <v-text-field
          :model-value="supplier.name"
          label="ספק"
          variant="outlined"
          density="comfortable"
          readonly
        />

        <v-text-field
          v-model="monthYear"
          label="חודש*"
          type="month"
          variant="outlined"
          density="comfortable"
          :rules="[rules.required()]"
        />
      </v-card-text>

      <v-divider class="mt-2" />

      <v-card-actions class="pa-4">
        <v-spacer />
        <AppButton
          color="primary"
          type="submit"
          variant="elevated"
          size="large"
          :loading="loading"
          :disabled="!isValid"
        >
          הורד סיכום
        </AppButton>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ISupplier } from '@supplier/types/ISupplier.types'
import { rules } from '@shared/utils/rules.util'
import type { VForm } from 'vuetify/components'

const props = defineProps<{
  supplier: ISupplier
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { id: string; monthYear: string }): void
}>()

const formRef = ref<VForm | null>(null)
const isValid = ref(false)

const now = new Date()
const monthYear = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

const submit = async () => {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (valid) emit('submit', { id: props.supplier.id, monthYear: monthYear.value })
}
</script>
