<template>
  <div class="session-hero">
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
                :loading="isSummarizing || isEmployeeSummarizing"
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

      <!-- Session title + status — click to expand/collapse the details below -->
      <div
        class="hero-title-row"
        :class="expanded ? 'mb-5' : 'mb-0'"
        role="button"
        tabindex="0"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
        @keydown.enter="expanded = !expanded"
        @keydown.space.prevent="expanded = !expanded"
      >
        <h1 class="session-title">{{ session.name }}</h1>
        <div class="status-badge" :class="`status-badge--${session.status}`">
          <span class="status-dot" />
          <span class="status-text">{{ statusMeta.label }}</span>
        </div>
        <v-icon class="expand-chevron" :class="{ 'expand-chevron--open': expanded }">
          mdi-chevron-down
        </v-icon>
      </div>

      <!-- Collapsible details (date / location / participants + staffing) -->
      <v-expand-transition>
        <div v-show="expanded">
          <!-- Info stat cards (each editable inline by admins) -->
          <div class="hero-stats mb-5">
            <div v-for="card in statCards" :key="card.key" class="stat-card">
              <div class="stat-icon-wrap">
                <v-icon size="18" :color="card.color">{{ card.icon }}</v-icon>
              </div>

              <div class="stat-content">
                <span class="stat-label">{{ card.label }}</span>

                <div v-if="editingStat === card.key" class="d-flex align-center ga-1">
                  <input
                    v-model="statDraft"
                    :type="card.type"
                    class="inline-input"
                    @keyup.enter="saveStat"
                    @keyup.esc="editingStat = null"
                  />
                  <AppButton
                    icon="mdi-check"
                    size="x-small"
                    variant="text"
                    color="success"
                    :loading="isSaving"
                    @click="saveStat"
                  />
                  <AppButton
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    @click="editingStat = null"
                  />
                </div>
                <span v-else class="stat-value">{{ card.display }}</span>
              </div>

              <AppButton
                v-if="canEdit && editingStat !== card.key"
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                class="stat-edit"
                @click="startEditStat(card.key)"
              />
            </div>
          </div>

          <!-- Staffing section -->
          <div class="staffing-section">
            <div class="staffing-header mb-3">
              <v-icon size="14" color="medium-emphasis">mdi-account-details-outline</v-icon>
              <span class="staffing-label">תקן כוח אדם נדרש (סד"ק)</span>
              <div class="staffing-divider" />
            </div>

            <div class="staffing-chips">
              <div
                v-for="role in staffingRoles"
                :key="role.key"
                class="role-chip"
                :class="[
                  role.cls,
                  {
                    'role-chip--editable': canEdit,
                    'role-chip--editing': editingChip === role.key,
                  },
                ]"
                @click="editingChip !== role.key && startEditChip(role.key)"
              >
                <v-icon size="14">{{ role.icon }}</v-icon>
                <span class="role-label">{{ role.label }}</span>

                <template v-if="editingChip === role.key">
                  <input
                    v-model.number="chipDraft"
                    type="number"
                    min="0"
                    class="role-input"
                    @click.stop
                    @keyup.enter="saveChip(role.key)"
                    @keyup.esc="editingChip = null"
                  />
                  <v-icon
                    size="16"
                    class="role-action"
                    :class="{ 'role-action--busy': isSaving }"
                    @click.stop="saveChip(role.key)"
                  >
                    mdi-check
                  </v-icon>
                  <v-icon size="16" class="role-action" @click.stop="editingChip = null"
                    >mdi-close</v-icon
                  >
                </template>
                <span v-else class="role-count">{{ session[role.key] ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </v-expand-transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ISession, IUpdateSession } from '@session/types/ISession.types'
import { ClientsStore, SessionStore, SessionsStore, AuthStore, SnackbarStore } from '@stores'
import AuthWrapper from '@auth/components/AuthWrapper.vue'
import { UserRole } from '@auth/types/IUser.types'
import { getSessionStatusMeta } from '@session/types/status.types'
import type { IListAction } from '@shared/types/IListAction.types'
import { sessionProvider } from '@session/providers/session.provider'

const props = defineProps<{
  session: ISession
  isSummarizing: boolean
  isEmployeeSummarizing: boolean
}>()

const emit = defineEmits<{
  (e: 'summarize'): void
  (e: 'employee-summary'): void
  (e: 'update'): void
  (e: 'staffing'): void
  (e: 'close-session'): void
}>()

// Collapsed by default; title row toggles details
const expanded = ref(false)

// --- Inline editing (admins only) ---
const sessionStore = SessionStore()
const sessionsStore = SessionsStore()
const authStore = AuthStore()
const snackbar = SnackbarStore()

const canEdit = computed(() => authStore.isAdmin)
const isSaving = ref(false)

// Persist partial change by sending the whole session object
const saveField = async (partial: Partial<IUpdateSession>): Promise<boolean> => {
  isSaving.value = true
  try {
    const payload: IUpdateSession = {
      ...partial,
      id: props.session.id,
      timestamp: props.session.timestamp,
    }
    const result = await sessionProvider.update(props.session.id, payload)
    if (!result.success) {
      snackbar.open(result.message || 'שגיאה בעדכון', 'error')
      return false
    }
    // Re-fetch to pick up server's new optimistic-lock timestamp
    const fresh = await sessionProvider.get(props.session.id)
    const updated = (
      fresh.success && fresh.data ? fresh.data : { ...props.session, ...partial }
    ) as ISession
    sessionStore.setSession(updated)
    sessionsStore.update(updated)
    snackbar.open('עודכן בהצלחה', 'success')
    return true
  } finally {
    isSaving.value = false
  }
}

// Stat cards (date / location / participants)
type StatKey = 'datetime' | 'location' | 'peopleAmount'
const editingStat = ref<StatKey | null>(null)
const statDraft = ref<string>('')

const statCards = computed(() => [
  {
    key: 'datetime' as StatKey,
    label: 'תאריך',
    icon: 'mdi-calendar-month-outline',
    color: 'primary',
    type: 'date',
    display: new Date(props.session.datetime).toLocaleDateString('he-IL'),
  },
  {
    key: 'location' as StatKey,
    label: 'מיקום',
    icon: 'mdi-map-marker-outline',
    color: 'info',
    type: 'text',
    display: props.session.location,
  },
  {
    key: 'peopleAmount' as StatKey,
    label: 'משתתפים',
    icon: 'mdi-account-group-outline',
    color: 'success',
    type: 'number',
    display: `${props.session.peopleAmount} איש`,
  },
])

const startEditStat = (key: StatKey) => {
  editingStat.value = key
  statDraft.value =
    key === 'datetime'
      ? (props.session.datetime || '').slice(0, 10)
      : String(props.session[key] ?? '')
}

const saveStat = async () => {
  const key = editingStat.value
  if (!key) return
  let partial: Partial<IUpdateSession>
  if (key === 'peopleAmount') partial = { peopleAmount: Number(statDraft.value) }
  else if (key === 'datetime') partial = { datetime: statDraft.value }
  else partial = { location: statDraft.value }
  if (await saveField(partial)) editingStat.value = null
}

// Staffing chips
type StaffKey =
  | 'barmanAmount'
  | 'waitersAmount'
  | 'barMangerAmount'
  | 'waiterMangerAmount'
  | 'Runners'
const staffingRoles: { key: StaffKey; label: string; icon: string; cls: string }[] = [
  { key: 'barmanAmount', label: 'ברמנים', icon: 'mdi-glass-cocktail', cls: 'role-bar' },
  { key: 'waitersAmount', label: 'מלצרים', icon: 'mdi-room-service-outline', cls: 'role-waiter' },
  {
    key: 'barMangerAmount',
    label: 'מנהלי בר',
    icon: 'mdi-account-star-outline',
    cls: 'role-bar-manager',
  },
  {
    key: 'waiterMangerAmount',
    label: 'מנהלי מלצרים',
    icon: 'mdi-account-supervisor-outline',
    cls: 'role-waiter-manager',
  },
  { key: 'Runners', label: 'ראנרים', icon: 'mdi-run-fast', cls: 'role-runner' },
]

const editingChip = ref<StaffKey | null>(null)
const chipDraft = ref<number>(0)

const startEditChip = (key: StaffKey) => {
  if (!canEdit.value) return
  editingChip.value = key
  chipDraft.value = Number(props.session[key] ?? 0)
}

const saveChip = async (key: StaffKey) => {
  const partial = { [key]: Number(chipDraft.value) } as Partial<IUpdateSession>
  if (await saveField(partial)) editingChip.value = null
}

const route = useRoute()
const router = useRouter()
const clientsStore = ClientsStore()

const clientName = computed(() => {
  const targetId = props.session.clientId || (route.params.clientId as string)
  const client = clientsStore.clients?.find((c) => c.id === targetId)
  return client ? client.name : 'Unknown Client'
})

const statusMeta = computed(() => getSessionStatusMeta(props.session.status))

// Menu actions — employees report sits in own group
const menuActions = computed<IListAction[][]>(() => {
  const main: IListAction[] = []
  if (authStore.isAdmin) {
    main.push({ title: 'עדכן אירוע', icon: 'mdi-pencil-outline', handler: () => emit('update') })
    main.push({ title: 'סד"ק', icon: 'mdi-account-multiple-outline', handler: () => emit('staffing') })
  }
  if (props.session.status !== 'close') {
    main.push({ title: 'סגור אירוע', icon: 'mdi-lock-outline', handler: () => emit('close-session') })
  } else {
    main.push({
      title: 'צפה בסיכום אירוע',
      icon: 'mdi-file-chart-outline',
      handler: () =>
        router.push({
          name: 'session-summary',
          params: {
            clientId: props.session.clientId || (route.params.clientId as string) || 'general',
            id: props.session.id,
          },
        }),
    })
  }
  return [
    main,
    [
      {
        title: 'הורד דוח עובדים',
        icon: 'mdi-file-pdf-box',
        disabled: props.isEmployeeSummarizing,
        handler: () => emit('employee-summary'),
      },
    ],
  ]
})
</script>

<style scoped>
/* ─── Hero wrapper ──────────────────────────────────────────────── */
.session-hero {
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
  cursor: pointer;
  user-select: none;
}

/* Expand/collapse affordance, pushed to the row's end and rotating when open */
.expand-chevron {
  margin-inline-start: auto;
  color: rgba(var(--v-theme-on-surface), 0.5);
  transition: transform 0.2s ease;
}
.expand-chevron--open {
  transform: rotate(180deg);
}

.session-title {
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

/* ─── Status badge ─────────────────────────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  flex-shrink: 0;
}

.status-dot {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  line-height: 1;
}

/* active → blue pulse */
.status-badge--active {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.25);
  color: #3b82f6;
}
.status-badge--active .status-dot {
  background: #3b82f6;
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  animation: pulse-blue 2s infinite;
}

/* closed → green */
.status-badge--close {
  background: rgba(52, 211, 153, 0.1);
  border-color: rgba(52, 211, 153, 0.25);
  color: #34d399;
}
.status-badge--close .status-dot {
  background: #34d399;
}

/* flagged → amber */
.status-badge--flag {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.25);
  color: #fbbf24;
}
.status-badge--flag .status-dot {
  background: #fbbf24;
  box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5);
  animation: pulse-amber 2s infinite;
}

@keyframes pulse-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

@keyframes pulse-amber {
  0% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(251, 191, 36, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
  }
}

/* ─── Stat cards ────────────────────────────────────────────────── */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 480px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.1);
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
  flex: 1 1 auto;
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

.stat-value small {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.6;
}

/* ─── Staffing section ──────────────────────────────────────────── */
.staffing-section {
  padding-top: 4px;
}

.staffing-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.staffing-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  white-space: nowrap;
}

.staffing-divider {
  flex: 1;
  height: 1px;
  background: rgba(var(--v-border-color), 0.15);
}

.staffing-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ─── Role chips ────────────────────────────────────────────────── */
.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px 5px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: default;
}

.role-label {
  opacity: 0.85;
}

.role-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0 5px;
}

/* colour variants */
.role-bar {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
}
.role-bar .role-count {
  background: rgba(var(--v-theme-primary), 0.15);
}

.role-waiter {
  background: rgba(var(--v-theme-info), 0.08);
  border-color: rgba(var(--v-theme-info), 0.2);
  color: rgb(var(--v-theme-info));
}
.role-waiter .role-count {
  background: rgba(var(--v-theme-info), 0.15);
}

.role-bar-manager {
  background: rgba(var(--v-theme-secondary), 0.08);
  border-color: rgba(var(--v-theme-secondary), 0.2);
  color: rgb(var(--v-theme-secondary));
}
.role-bar-manager .role-count {
  background: rgba(var(--v-theme-secondary), 0.15);
}

.role-waiter-manager {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.25);
  color: rgb(139, 92, 246);
}
.role-waiter-manager .role-count {
  background: rgba(139, 92, 246, 0.15);
}

.role-runner {
  background: rgba(var(--v-theme-warning), 0.08);
  border-color: rgba(var(--v-theme-warning), 0.22);
  color: rgb(var(--v-theme-warning));
}
.role-runner .role-count {
  background: rgba(var(--v-theme-warning), 0.18);
}

/* ─── Actions menu ──────────────────────────────────────────────── */
.actions-menu-list {
  min-width: 200px;
}

/* ─── Inline editing ────────────────────────────────────────────── */
.stat-edit {
  margin-inline-start: auto;
  opacity: 0.55;
}
.stat-edit:hover {
  opacity: 1;
}

/* Generic inline field used in the stat cards */
.inline-input {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 8px;
  padding: 2px 8px;
  outline: none;
}
.inline-input:focus {
  border-color: rgb(var(--v-theme-primary));
}

/* Editable staffing chips */
.role-chip--editable {
  cursor: pointer;
}
.role-chip--editable:hover {
  filter: brightness(0.97);
}
.role-chip--editing {
  cursor: default;
}

.role-input {
  width: 44px;
  font-size: 0.82rem;
  font-weight: 800;
  text-align: center;
  color: inherit;
  background: transparent;
  border: none;
  border-bottom: 1px solid currentColor;
  outline: none;
  padding: 0 2px;
  -moz-appearance: textfield;
}
.role-input::-webkit-outer-spin-button,
.role-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.role-action {
  cursor: pointer;
  opacity: 0.85;
}
.role-action:hover {
  opacity: 1;
}
.role-action--busy {
  opacity: 0.4;
  pointer-events: none;
}
</style>
