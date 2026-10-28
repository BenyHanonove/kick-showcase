<template>
  <v-chip
    :size="props.size"
    :color="props.meta.color"
    :variant="props.variant"
    :density="props.density"
    class="font-weight-bold px-2 text-caption"
  >
    <v-icon :icon="props.meta.icon" start size="12" class="me-1" />
    {{ props.meta.label }}
  </v-chip>
</template>

<script setup lang="ts">
import type { IStatusMeta } from '../../types/IStatusMeta.types'

const props = withDefaults(
  defineProps<{
    meta: IStatusMeta
    size?: string
    variant?: 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain' | 'text'
    density?: 'default' | 'comfortable' | 'compact'
  }>(),
  {
    size: 'small',
    variant: 'flat',
  },
)
</script>
