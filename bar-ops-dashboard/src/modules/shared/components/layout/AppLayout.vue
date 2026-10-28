<template>
  <v-app>
    <AuthWrapper :level="UserRole.MANAGER">
      <AppBar @toggle="drawer = !drawer" />
      <AppDrawer v-model="drawer" />

      <v-main>
        <router-view />
      </v-main>
    </AuthWrapper>

    <AuthWrapper :level="UserRole.USER" :specific="true">
      <no-permission />
    </AuthWrapper>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Import custom components
import AppBar from '@shared/components/layout/AppBar.vue'
import AppDrawer from '@shared/components/layout/AppDrawer.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import NoPermission from '@auth/components/NoPermission.vue'

// Import types
import { UserRole } from '@auth/types/IUser.types'

const drawer = ref(false)
</script>
