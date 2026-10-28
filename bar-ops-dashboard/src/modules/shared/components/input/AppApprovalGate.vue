<template>
  <div class="approval-gate">
    <v-alert
      :type="severity"
      variant="tonal"
      class="rounded-xl mb-4 text-caption"
      density="comfortable"
    >
      {{ message }}
    </v-alert>

    <slot />

    <v-checkbox
      v-model="model"
      :label="checkboxLabel"
      color="primary"
      hide-details
      class="mt-2 font-weight-bold text-body-2"
    />
  </div>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    message: string
    checkboxLabel: string
    severity?: 'warning' | 'error'
  }>(),
  {
    severity: 'warning',
  },
)
</script>
