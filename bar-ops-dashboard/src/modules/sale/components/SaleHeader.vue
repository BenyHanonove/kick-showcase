<template>
  <div class="sale-hero">
    <!-- Decorative gradient accent bar -->
    <div class="hero-accent-bar" />

    <div class="hero-inner pa-5 pa-sm-6">
      <!-- Top row: client + actions -->
      <div class="hero-topbar mb-4">
        <div class="client-badge">
          <v-icon size="16" class="client-icon">mdi-account-circle-outline</v-icon>
          <span class="client-name">{{ clientName }}</span>
        </div>

        <auth-wrapper :level="UserRole.ADMIN">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <AppButton
                variant="tonal"
                color="primary"
                append-icon="mdi-chevron-down"
                :loading="isSummarizing"
                class="font-weight-bold"
                v-bind="menuProps"
                rounded="pill"
              >
                פעולות
              </AppButton>
            </template>

            <AppList
              :actions="menuActions"
              density="default"
              rounded="lg"
              elevation="4"
              class="actions-menu-list"
            />
          </v-menu>
        </auth-wrapper>
      </div>

      <!-- Sale title -->
      <div class="hero-title-row mb-5">
        <h1 class="sale-title">{{ sale.name }}</h1>
      </div>

      <!-- Info stat cards -->
      <div class="hero-stats">
        <div class="stat-card">
          <div class="stat-icon-wrap">
            <v-icon size="18" color="primary">mdi-calendar-month-outline</v-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">תאריך</span>
            <span class="stat-value">{{
              new Date(sale.datetime).toLocaleDateString('he-IL')
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { ISale } from '@sale/types/ISale.types'
import { ClientsStore } from '@stores'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import { UserRole } from '@auth/types/IUser.types'
import type { IListAction } from '@shared/types/IListAction.types'

const props = defineProps<{
  sale: ISale
  isSummarizing: boolean
}>()

const emit = defineEmits<{
  (e: 'summarize'): void
  (e: 'update'): void
}>()

// Menu actions — summary action in its own group
const menuActions = computed<IListAction[][]>(() => [
  [{ title: 'עדכן מכירה', icon: 'mdi-pencil-outline', handler: () => emit('update') }],
  [
    {
      title: 'צור סיכום מכירה',
      icon: 'mdi-file-chart-outline',
      disabled: props.isSummarizing,
      handler: () => emit('summarize'),
    },
  ],
])

const route = useRoute()
const clientsStore = ClientsStore()

const clientName = computed(() => {
  const targetId = props.sale.clientId || (route.params.clientId as string)
  const client = clientsStore.clients?.find((c) => c.id === targetId)
  return client ? client.name : 'Unknown Client'
})
</script>

<style scoped>
/* ─── Hero wrapper ──────────────────────────────────────────────── */
.sale-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  border: 1px solid rgba(var(--v-border-color), 0.12);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 8px 32px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

/* ─── Accent gradient bar (top edge) ───────────────────────────── */
.hero-accent-bar {
  height: 4px;
  background: linear-gradient(
    90deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-info)) 50%,
    rgb(var(--v-theme-secondary)) 100%
  );
}

.hero-inner {
  position: relative;
}

/* ─── Top bar ───────────────────────────────────────────────────── */
.hero-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.client-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-secondary), 0.08);
  border: 1px solid rgba(var(--v-theme-secondary), 0.2);
}

.client-icon {
  color: rgb(var(--v-theme-secondary));
  opacity: 0.8;
}

.client-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
  letter-spacing: 0.01em;
}

/* ─── Title row ─────────────────────────────────────────────────── */
.hero-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.sale-title {
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.1);
  min-width: 200px;
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Actions menu ──────────────────────────────────────────────── */
.actions-menu-list {
  min-width: 200px;
}
</style>
