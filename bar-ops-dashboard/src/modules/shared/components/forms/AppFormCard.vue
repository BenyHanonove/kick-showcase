<template>
  <v-card class="pa-2 rounded-lg" width="100%">
    <v-card-title class="text-h5 font-weight-bold pa-4">
      {{ props.title }}
    </v-card-title>

    <v-form ref="formRef" v-model="isValid" @submit.prevent="submit">
      <v-card-text class="d-flex flex-column ga-2">
        <slot />
      </v-card-text>

      <v-divider class="mt-2" />

      <v-card-actions class="pa-4">
        <v-spacer />
        <AppButton v-if="props.showCancel" color="error" variant="text" @click="emit('cancel')">
          {{ props.cancelText || 'ביטול' }}
        </AppButton>
        <AppButton v-if="props.showReset" color="error" variant="text" @click="emit('reset')">
          נקה טופס
        </AppButton>
        <slot name="actions-extra" />
        <AppButton
          color="primary"
          type="submit"
          variant="elevated"
          size="large"
          :loading="props.loading"
          :disabled="!isValid"
        >
          {{ props.submitText }}
        </AppButton>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  submitText: string
  loading: boolean
  showReset?: boolean
  showCancel?: boolean
  cancelText?: string
}>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const isValid = ref(false)

const submit = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    emit('submit')
  }
}

// Expose internal form methods if needed (like resetValidation)
defineExpose({
  resetValidation: () => formRef.value?.resetValidation(),
})
</script>
