<template>
  <v-row class="mb-4 pa-6">
    <v-text-field
      v-model="searchQuery"
      label="חפש ספק לפי שם..."
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      hide-details
      clearable
    />
  </v-row>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SuppliersStore } from '@stores'

const suppliersStore = SuppliersStore()
const { searchQuery } = storeToRefs(suppliersStore)
</script>
