<template>
  <v-app-bar height="64" color="surface" flat class="app-bar">
    <v-app-bar-nav-icon class="nav-icon" @click="$emit('toggle')" />

    <div class="brand d-flex align-center" @click="router.push('/dashboard')" aria-label="KICK">
      <AppLogo :height="26" />
    </div>

    <v-spacer />

    <v-menu location="bottom end" offset="8" transition="slide-y-transition">
      <template #activator="{ props: menuProps }">
        <button v-bind="menuProps" type="button" class="account-pill me-4">
          <v-badge dot color="success" location="bottom start" offset-x="2" offset-y="2" class="account-badge">
            <v-avatar color="primary" size="32" class="account-avatar">
              <v-icon size="19" color="white">mdi-account</v-icon>
            </v-avatar>
          </v-badge>

          <div class="account-text d-flex flex-column">
            <span class="text-caption font-weight-bold">{{ firstName }} {{ lastName }}</span>
            <span class="account-role">{{ roleLabel }}</span>
          </div>

          <v-icon size="18" class="account-chevron">mdi-chevron-down</v-icon>
        </button>
      </template>

      <AppList :actions="accountActions" class="account-menu" />
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { AuthStore } from '@stores'
import { UserRole } from '@auth/types/IUser.types'
import { useAuthCrud } from '@auth/composables/auth.crud'

import type { IListAction } from '@shared/types/IListAction.types'

import AppLogo from '@shared/components/layout/AppLogo.vue'
import AppList from '@shared/components/layout/AppList.vue'

defineEmits(['toggle'])

const router = useRouter()
const authStore = AuthStore()
const { handleLogout } = useAuthCrud()

const firstName = computed(() => authStore.user?.firstName || 'משתמש')
const lastName = computed(() => authStore.user?.lastName || '')

// Hebrew labels for the user's role (falls back to a neutral label)
const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'מנהל מערכת',
  [UserRole.MANAGER]: 'מנהל',
  [UserRole.USER]: 'משתמש',
}
const roleLabel = computed(() => (authStore.role ? ROLE_LABELS[authStore.role] : 'מחובר'))

// Account menu — logout keeps its own group at the bottom
const accountActions = computed<IListAction[][]>(() => [
  [{ title: 'התנתק', icon: 'mdi-logout', color: 'error', handler: handleLogout }],
])
</script>

<style scoped>
/* Separate the bar from the content with a hairline border + soft card shadow */
.app-bar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity, 0.08)) !important;
  background-color: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  box-shadow: var(--bo-shadow-card) !important;
}

/* Nav icon picks up a warm clay tint on hover */
.nav-icon:hover {
  color: rgb(var(--v-theme-primary));
}

.brand {
  cursor: pointer;
}

/* Account control: elevated white pill that opens the account menu */
.account-pill {
  display: flex;
  align-items: center;
  gap: 9px;
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: var(--bo-radius-xl);
  padding-block: 4px;
  padding-inline: 6px 12px;
  box-shadow: var(--bo-shadow-card);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}
.account-pill:hover {
  box-shadow: var(--bo-shadow-raised);
  border-color: rgb(var(--v-theme-primary-soft));
  transform: translateY(-1px);
}

.account-text {
  line-height: 1.15;
  text-align: start;
}

.account-role {
  font-size: 10.5px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
}

.account-chevron {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.5;
}

.account-menu {
  min-width: 200px;
  box-shadow: var(--bo-shadow-popover);
}

.account-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-avatar {
  border-radius: 50% !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
  background-color: rgb(var(--v-theme-primary)) !important;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.account-avatar :deep(.v-icon) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: auto !important;
}
</style>
