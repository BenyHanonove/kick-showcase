<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useRoute } from 'vue-router'
import { useTokenManager } from '@auth/composables/token.manager'
import { tokenMemory } from '@auth/composables/token.memory'
import AppSnackbar from '@shared/components/feedback/AppSnackbar.vue'

const tokenManager = useTokenManager()
const theme = useTheme()
const route = useRoute()

onMounted(() => {
  // Tokens live in memory only, reset on refresh
  if (tokenMemory.tokens.value) {
    tokenManager.initializeTokenRefresh(tokenMemory.tokens.value)
  }

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    try {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        theme.change(e.matches ? 'dark' : 'light')
      }

      // Subscribe to changes
      darkModeQuery.addEventListener('change', handleThemeChange)
    } catch {
      // Fallback if matchMedia is not supported
      console.warn('System theme detection not supported in this environment')
    }
  }
})
</script>

<template>
  <!-- Public pages get the strong keyboard focus ring (see global.css) -->
  <v-app :class="{ 'public-page': route.meta.isPublic }">
    <a href="#main-content" class="skip-to-content">דלג לתוכן המרכזי</a>
    <RouterView />
    <AppSnackbar />
  </v-app>
</template>
