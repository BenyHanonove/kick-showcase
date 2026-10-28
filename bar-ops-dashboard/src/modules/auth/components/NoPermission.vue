<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center text-center">
    <v-icon icon="mdi-lock-outline" size="64" color="error" class="mb-4" />

    <h1 class="text-h5 font-weight-bold mb-2">אין הרשאות גישה</h1>

    <p class="text-body-1 mb-6">נא ליצור קשר עם מנהל המערכת לקבלת גישה.</p>

    <AppButton color="primary" variant="elevated" prepend-icon="mdi-logout" @click="handleLogout">
      התנתקות
    </AppButton>
  </v-container>
</template>

<script setup lang="ts">
import { useAuthCrud } from '@auth/composables/auth.crud'

// Initialize hooks
const { handleLogout } = useAuthCrud()
</script>
