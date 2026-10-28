<script setup lang="ts">
import { SnackbarStore } from '@stores'

const snackbar = SnackbarStore()
</script>

<template>
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="bottom center"
    elevation="4"
  >
    {{ snackbar.message }}

    <template #actions>
      <AppButton icon="mdi-close" variant="text" @click="snackbar.close" />
    </template>
  </v-snackbar>
</template>
