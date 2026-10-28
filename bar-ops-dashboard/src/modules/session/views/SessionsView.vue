<template>
  <v-container>
    <PageHeader
      :path="['בית', 'אירועים']"
      title="אירועים"
      desc="ניהול רשימת האירועים והפגישות שלנו"
      :min-role="UserRole.MANAGER"
    />

    <app-filter
      v-model:filters="filters"
      :client-options="clientOptions"
      :clients-loading="clientsStore.loading"
      :selected-day-label="selectedDayLabel"
      @filter="handleFilter"
    >
      <app-calendar
        :items="calendarItems"
        :legend="legend"
        :month-year="monthYear"
        :selected-day="selectedDay"
        @select-day="selectedDay = $event"
        @update:month-year="handleMonthChange"
      />
    </app-filter>

    <global-loading v-if="loading" />

    <template v-else>
      <v-divider class="mt-4" />

      <div class="d-flex align-center justify-space-between mt-6 mb-3 ga-3">
        <h3 class="text-subtitle-1 font-weight-bold">
          {{ selectedDay ? `אירועי ${selectedDayLabel}` : 'כל האירועים' }}
        </h3>

        <div class="d-flex align-center ga-2">
          <AppButton
            v-if="selectedDay"
            variant="text"
            size="small"
            prepend-icon="mdi-close"
            @click="selectedDay = null"
          >
            נקה סינון
          </AppButton>

          <AuthWrapper :level="UserRole.ADMIN">
            <AppButton
              color="primary"
              prepend-icon="mdi-plus"
              rounded="lg"
              @click="SessionCrud.createDialogOpen.value = true"
            >
              צור אירוע
            </AppButton>
          </AuthWrapper>
        </div>
      </div>

      <!-- Status Chips Filter -->
      <v-chip-group v-model="activeStatus" mandatory variant="tonal" class="mb-2">
        <v-chip value="all" filter size="small" class="font-weight-bold" color="grey-darken-3">
          הכל ({{ sessionsCount['all'] }})
        </v-chip>
        <v-chip
          v-for="opt in statusFilterOptions"
          :key="opt.value"
          :value="opt.value"
          :color="opt.color"
          filter
          size="small"
          class="font-weight-bold"
        >
          <v-icon :icon="opt.icon" start size="16" class="me-1" />
          {{ opt.title }} ({{ sessionsCount[opt.value] }})
        </v-chip>
      </v-chip-group>
      <v-row>
        <v-col
          v-for="session in displayedSessions"
          :key="session.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <session-card
            :session="session"
            class="h-100"
            @edit="SessionCrud.openUpdate(session)"
            @delete="SessionCrud.openDelete(session)"
          />
        </v-col>
      </v-row>
    </template>

    <AppDialog v-model="SessionCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת אירוע חדש"
        submit-text="צור אירוע"
        :loading="SessionCrud.isCreating.value"
        :fields="SessionCrud.sessionFields.value"
        :initial-values="SessionCrud.sessionInitialState"
        show-reset
        @submit="SessionCrud.handleCreate"
      >
        <!-- Client field with a pinned, visually distinct "add new client" option at the top -->
        <template #clientId="{ field, form }">
          <v-select
            :model-value="form.clientId as string"
            :items="clientSelectItems"
            :label="field.label"
            :rules="field.rules"
            :loading="clientsStore.loading"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            :menu-props="{ class: 'rounded-lg' }"
            @update:model-value="(val) => onClientFieldChange(form, val)"
          >
            <template #item="{ props: itemProps, item }">
              <template v-if="item.value === ADD_NEW_CLIENT">
                <v-list-item
                  v-bind="itemProps"
                  class="add-new-client-item text-primary font-weight-bold"
                >
                  <template #title>
                    <span class="d-flex align-center justify-center ga-2 w-100">
                      <v-icon size="20">mdi-plus-circle</v-icon>
                      {{ item.title }}
                    </span>
                  </template>
                </v-list-item>
                <v-divider class="my-1" />
              </template>
              <v-list-item v-else v-bind="itemProps" />
            </template>
          </v-select>
        </template>
      </GenericForm>
    </AppDialog>

    <!-- Nested dialog: create a new client without leaving the event form -->
    <AppDialog v-model="ClientCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="הוספת לקוח חדש"
        submit-text="צור לקוח"
        :loading="ClientCrud.isCreating.value"
        :fields="ClientCrud.clientFields"
        :initial-values="ClientCrud.clientInitialState"
        show-cancel
        @submit="handleClientCreate"
        @cancel="ClientCrud.createDialogOpen.value = false"
      />
    </AppDialog>

    <AppDialog v-model="SessionCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="SessionCrud.selectedItem.value"
        title="עריכת אירוע"
        submit-text="עדכן אירוע"
        :loading="SessionCrud.isUpdating.value"
        :fields="SessionCrud.sessionUpdateFields.value"
        :initial-values="SessionCrud.sessionUpdateInitial.value"
        show-cancel
        @submit="SessionCrud.handleUpdate"
        @cancel="SessionCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <AppDialog
      v-model="SessionCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת אירוע"
      :item-name="SessionCrud.selectedItem.value ? SessionCrud.selectedItem.value.name : ''"
      :loading="SessionCrud.isDeleting.value"
      @confirm="SessionCrud.handleDelete"
      @cancel="SessionCrud.deleteDialogOpen.value = false"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

// Import stores
import { SessionsStore, ClientsStore } from '@stores'

// Import composables
import { useSessionCrud } from '@session/composables/session.crud'
import { useClientCrud } from '@client/composables/client.crud'
import { useCalendarFilter } from '@shared/composables/useCalendarFilter.composable'

// Import custom components
import SessionCard from '@session/components/SessionCard.vue'
import AppCalendar from '@shared/components/data/AppCalendar.vue'
import AppFilter from '@shared/components/forms/AppFilter.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'

import { UserRole } from '@auth/types/IUser.types'
import { SessionStatus, SessionStatusMeta, getSessionStatusMeta } from '../types/status.types'
import type { ISession } from '@session/types/ISession.types'
import type { ICreateClient } from '@client/types/IClient.types'

const sessionsStore = SessionsStore()
const clientsStore = ClientsStore()

const { sessions, loading, filters } = storeToRefs(sessionsStore)

const SessionCrud = useSessionCrud(sessionsStore)
const ClientCrud = useClientCrud()

// --- Inline "add new client" from the event form's client dropdown ---
const ADD_NEW_CLIENT = '__add_new_client__'

// Pinned "add new" entry followed by the real clients
const clientSelectItems = computed(() => [
  { title: 'הוסף לקוח חדש', value: ADD_NEW_CLIENT },
  ...(clientsStore.clients || []).map((c) => ({ title: c.brand, value: c.id })),
])

// Client options for the filter bar's brand autocomplete
const clientOptions = computed(() =>
  (clientsStore.clients || []).map((c) => ({ title: c.brand, value: c.id })),
)

// Event form awaiting the freshly created client's id
const pendingClientForm = ref<Record<string, unknown> | null>(null)

const onClientFieldChange = (form: Record<string, unknown>, value: unknown) => {
  if (value === ADD_NEW_CLIENT) {
    pendingClientForm.value = form
    ClientCrud.createDialogOpen.value = true
  } else {
    form.clientId = value
  }
}

const handleClientCreate = async (payload: ICreateClient) => {
  const before = new Set((clientsStore.clients || []).map((c) => c.id))
  await ClientCrud.handleCreate(payload)
  // Auto-select the newly added client in the event form
  const created = (clientsStore.clients || []).find((c) => !before.has(c.id))
  if (created && pendingClientForm.value) {
    pendingClientForm.value.clientId = created.id
  }
}

const {
  selectedDay,
  monthYear,
  selectedDayLabel,
  handleFilter,
  handleMonthChange,
  getFilteredItems,
} = useCalendarFilter(sessionsStore, SessionCrud.fetchSessions)

const activeStatus = ref<string>('all')

const statusFilterOptions = [
  {
    value: SessionStatus.ACTIVE,
    title: SessionStatusMeta[SessionStatus.ACTIVE].label,
    color: SessionStatusMeta[SessionStatus.ACTIVE].color,
    icon: SessionStatusMeta[SessionStatus.ACTIVE].icon,
  },
  {
    value: SessionStatus.FLAG,
    title: SessionStatusMeta[SessionStatus.FLAG].label,
    color: SessionStatusMeta[SessionStatus.FLAG].color,
    icon: SessionStatusMeta[SessionStatus.FLAG].icon,
  },
  {
    value: SessionStatus.CLOSE,
    title: SessionStatusMeta[SessionStatus.CLOSE].label,
    color: SessionStatusMeta[SessionStatus.CLOSE].color,
    icon: SessionStatusMeta[SessionStatus.CLOSE].icon,
  },
]

const sessionsCount = computed(() => {
  const list = sessions.value || []
  const counts = {
    all: list.length,
    [SessionStatus.ACTIVE]: 0,
    [SessionStatus.FLAG]: 0,
    [SessionStatus.CLOSE]: 0,
  }
  for (const s of list) {
    if (s.status && s.status in counts) {
      counts[s.status as SessionStatus]++
    }
  }
  return counts
})

const filteredByStatusSessions = computed(() => {
  const list = sessions.value || []
  if (activeStatus.value === 'all') return list
  return list.filter((s) => s.status === activeStatus.value)
})

const displayedSessions = computed<ISession[]>(
  () => getFilteredItems(filteredByStatusSessions.value) as ISession[],
)

// Session -> generic calendar item mapping (status drives the dot color/tooltip)
const calendarItems = computed(() =>
  (sessions.value || []).map((s) => ({
    id: s.id,
    dateKey: s.datetime.slice(0, 10),
    tooltip: `${s.name} · ${getSessionStatusMeta(s.status).label}`,
    color: getSessionStatusMeta(s.status).color,
  })),
)

const legend = computed(() =>
  Object.values(SessionStatusMeta).map((meta) => ({ label: meta.label, color: meta.color })),
)
</script>

<!-- Global (not scoped): the select menu is teleported to <body>, so a scoped rule
     wouldn't reach the "add new client" list item. -->
<style>
/* Make the "add new client" entry read as a tonal button with rounded (pill) edges.
   High specificity + !important to beat Vuetify's default .v-list-item radius/overlay. */
.v-list-item.add-new-client-item {
  background-color: rgb(var(--v-theme-primary-soft));
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  border-radius: 999px !important;
  overflow: hidden;
  margin: 8px;
  min-height: 40px;
}
.v-list-item.add-new-client-item .v-list-item__overlay {
  border-radius: 999px;
}
.v-list-item.add-new-client-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.16) !important;
}
</style>
