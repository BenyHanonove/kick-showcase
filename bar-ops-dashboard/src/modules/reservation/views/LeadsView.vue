<template>
  <v-container class="pa-4">
    <PageHeader
      v-model="query"
      :path="pageBreadcrumbs"
      :title="pageTitle"
      :desc="pageDesc"
      search-label="חפש לפי שם או טלפון..."
      :min-role="UserRole.MANAGER"
      :actions="pageHeaderActions"
    />

    <div class="mt-4">
      <AppTable
        :headers="tableHeaders"
        :items="results"
        :loading="isReservationsLoading"
        empty-icon="mdi-account-clock-outline"
        empty-feature="לידים"
      >
        <template #fullName="{ value }">
          <span class="font-weight-medium">{{ value }}</span>
        </template>
        <template #phone="{ value }">
          <a :href="`tel:${value}`" class="text-decoration-none text-inherit">
            {{ formatPhoneNumber(value as string) }}
          </a>
        </template>
        <template #eventType="{ value }">
          {{ ReservationEventTypeLabels[value as ReservationEventType] ?? value }}
        </template>
        <template #eventDate="{ value }">
          {{ value || '—' }}
        </template>
        <template #guestCount="{ value }">
          {{ value ?? '—' }}
        </template>
        <template #location="{ value }">
          {{ value || '—' }}
        </template>
        <template #notes="{ value }">
          <span class="lead-notes" :title="(value as string) || ''">{{ value || '—' }}</span>
        </template>
        <template #status="{ value }">
          <v-chip
            size="small"
            variant="tonal"
            :color="ReservationStatusColors[value as ReservationStatus]"
            class="font-weight-bold"
          >
            {{ ReservationStatusLabels[value as ReservationStatus] ?? value }}
          </v-chip>
        </template>
        <template #timestamp="{ value }">
          {{ formatDate(value as string) }}
        </template>
        <template #actions="{ item }">
          <v-progress-circular
            v-if="
              ReservationCrud.isDeleting.value &&
              ReservationCrud.selectedItem.value?.id === item.id
            "
            indeterminate
            size="20"
            width="2"
            color="error"
          />
          <v-menu
            v-else-if="isAdmin"
            :model-value="!!menuStates[item.id as string]"
            @update:model-value="(val) => (menuStates[item.id as string] = val)"
          >
            <template #activator="{ props: menuProps }">
              <AppButton
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                color="medium-emphasis"
                v-bind="menuProps"
                class="rounded-circle"
              />
            </template>
            <AppList :actions="itemMenuActions(item as unknown as IReservation)" />
          </v-menu>
        </template>
      </AppTable>
    </div>

    <!-- Create Dialog -->
    <AppDialog v-model="ReservationCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת ליד חדש"
        submit-text="צור ליד"
        :loading="ReservationCrud.isCreating.value"
        :fields="ReservationCrud.reservationFields"
        :initial-values="ReservationCrud.reservationInitialState"
        show-reset
        @submit="ReservationCrud.handleCreate"
      />
    </AppDialog>

    <!-- Update Dialog -->
    <AppDialog v-model="ReservationCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="ReservationCrud.selectedItem.value"
        title="עריכת ליד"
        submit-text="עדכן ליד"
        :loading="ReservationCrud.isUpdating.value"
        :fields="ReservationCrud.reservationUpdateFields"
        :initial-values="ReservationCrud.selectedItem.value"
        show-cancel
        @submit="ReservationCrud.handleUpdate"
        @cancel="ReservationCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <!-- Delete Dialog -->
    <AppDialog
      v-model="ReservationCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת ליד"
      :item-name="ReservationCrud.selectedItem.value?.fullName || ''"
      :loading="ReservationCrud.isDeleting.value"
      @confirm="ReservationCrud.handleDelete"
      @cancel="ReservationCrud.deleteDialogOpen.value = false"
    />
  </v-container>
</template>

<script setup lang="ts">
// Import vue APIs
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

// Import stores
import { ReservationsStore, AuthStore } from '@stores'

// Import composables
import { useReservationCrud } from '@reservation/composables/reservation.crud'
import { useSearch } from '@shared/composables/useSearch.composable'

// Import custom components
import AppTable from '@shared/components/data/AppTable.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'

// Import types
import type { IReservation } from '@reservation/types/IReservation.types'
import {
  ReservationEventType,
  ReservationEventTypeLabels,
} from '@reservation/types/ReservationEventType.types'
import {
  ReservationStatus,
  ReservationStatusColors,
  ReservationStatusLabels,
} from '@reservation/types/ReservationStatus.types'
import { UserRole } from '@auth/types/IUser.types'
import type { PageHeaderAction } from '@shared/types/PageHeader.types'
import type { IListAction } from '@shared/types/IListAction.types'

// Import utils
import { formatPhoneNumber } from '@shared/utils/formatters.util'

// Initialize stores
const reservationsStore = ReservationsStore()
const authStore = AuthStore()

// Store state
const { reservations, loading: isReservationsLoading } = storeToRefs(reservationsStore)
const { isAdmin } = storeToRefs(authStore)
const menuStates = ref<Record<string, boolean>>({})

// Header details computed properties
const pageTitle = computed(() => 'לידים')

const pageDesc = computed(() => 'פניות שהתקבלו מדף ההזמנות באתר')

const pageBreadcrumbs = computed(() => ['בית', pageTitle.value])

// Table headers config
const tableHeaders = [
  { key: 'fullName', label: 'שם מלא' },
  { key: 'phone', label: 'טלפון' },
  { key: 'eventType', label: 'סוג אירוע' },
  { key: 'eventDate', label: 'תאריך האירוע' },
  { key: 'guestCount', label: 'אורחים' },
  { key: 'location', label: 'אזור' },
  { key: 'notes', label: 'הערות' },
  { key: 'status', label: 'סטטוס' },
  { key: 'timestamp', label: 'התקבל' },
  { key: 'actions', label: '' },
]

// Modular client-side search
const { query, results } = useSearch(reservations, ['fullName', 'phone'])

// Initialize CRUD actions
const ReservationCrud = useReservationCrud()

// Page action buttons config
const pageHeaderActions = computed<PageHeaderAction[]>(() => [
  {
    label: 'הוסף ליד',
    action: () => {
      ReservationCrud.createDialogOpen.value = true
    },
    icon: 'mdi-plus',
  },
])

// Menu actions — destructive actions sit in own group; the API allows both to admins only
const itemMenuActions = (reservation: IReservation): IListAction[][] => [
  [
    {
      title: 'עדכן',
      icon: 'mdi-pencil',
      handler: () => ReservationCrud.openUpdate(reservation),
    },
  ],
  [
    {
      title: 'מחק',
      icon: 'mdi-delete',
      color: 'error',
      handler: () => ReservationCrud.openDelete(reservation),
    },
  ],
]

// Received date reads as a plain local date, the time of day carries no meaning here
const formatDate = (timestamp: string) => {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleDateString('he-IL')
}
</script>

<style scoped>
/* Notes are free text; keep the row height stable and reveal the rest on hover */
.lead-notes {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
