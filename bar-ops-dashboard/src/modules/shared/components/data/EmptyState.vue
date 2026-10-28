<template>
  <v-sheet
    color="transparent"
    max-width="440"
    width="100%"
    class="d-flex flex-column align-center text-center mx-auto mt-6 px-6 py-10 rounded-xl border border-dashed border-opacity-25"
  >
    <v-avatar size="88" color="primary" variant="tonal" class="mb-6">
      <v-icon :icon="props.icon" size="44" />
    </v-avatar>
    <h5 class="text-h6 font-weight-bold text-high-emphasis mb-2">
      {{ `אין רשומות של ${props.feature}` }}
    </h5>
    <p class="text-body-2 text-medium-emphasis mb-0">רשומות חדשות יופיעו כאן</p>
    <div v-if="$slots.default" class="w-100 mt-8 px-4">
      <slot />
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string
  feature: string
}>()
</script>
