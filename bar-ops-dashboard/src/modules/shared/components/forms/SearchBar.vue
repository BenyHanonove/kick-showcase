<template>
  <!-- Container caps the width so it lines up with the page's other containers -->
  <v-container class="pa-0">
    <v-text-field
      :model-value="query ?? ''"
      :label="label"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      rounded="lg"
      hide-details
      clearable
      @update:model-value="query = $event ?? ''"
      @click:clear="query = ''"
    />
  </v-container>
</template>

<script setup lang="ts">
defineProps<{
  /** Placeholder label for the input. */
  label?: string
}>()

/** Two-way bound search query string: `v-model`. */
const query = defineModel<string>({ default: '' })
</script>
