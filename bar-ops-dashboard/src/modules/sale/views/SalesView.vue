<template>
  <v-container>
    <PageHeader
      :path="['בית', 'מכירות']"
      title="מכירות"
      desc="ניהול רשימת המכירות וההזמנות שלנו"
      :min-role="UserRole.MANAGER"
      :actions="[
        {
          label: 'צור מכירה',
          action: () => (SaleCrud.createDialogOpen.value = true),
          icon: 'mdi-plus',
        },
        {
          label: 'סיכום לפי חודש',
          action: () => (summaryDialogOpen = true),
          icon: 'mdi-file-chart-outline',
          minRole: UserRole.ADMIN,
        },
      ]"
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
        :month-year="monthYear"
        :selected-day="selectedDay"
        @select-day="selectedDay = $event"
        @update:month-year="handleMonthChange"
      />
    </app-filter>

    <global-loading v-if="loading" />

    <template v-else>
      <v-divider class="mt-4" />

      <div class="d-flex align-center justify-space-between mt-6 mb-2 flex-wrap ga-3">
        <div class="d-flex align-center ga-3 flex-wrap">
          <h3 class="text-subtitle-1 font-weight-bold">
            {{ selectedDay ? `מכירות של ${selectedDayLabel}` : 'כל המכירות' }}
          </h3>
        </div>

        <AppButton
          v-if="selectedDay"
          variant="text"
          size="small"
          prepend-icon="mdi-close"
          @click="selectedDay = null"
        >
          נקה סינון
        </AppButton>
      </div>

      <v-row>
        <v-col v-for="sale in displayedSales" :key="sale.id" cols="12" sm="6" md="4" lg="3">
          <sale-card
            :sale="sale"
            class="h-100"
            @edit="SaleCrud.openUpdate(sale)"
            @delete="SaleCrud.openDelete(sale)"
            @update-paid="salesStore.update($event)"
          />
        </v-col>
      </v-row>
    </template>

    <AppDialog v-model="SaleCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת מכירה חדשה"
        submit-text="צור מכירה"
        :loading="SaleCrud.isCreating.value"
        :fields="SaleCrud.saleFields.value"
        :initial-values="SaleCrud.saleInitialState"
        show-reset
        @submit="SaleCrud.handleCreate"
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

    <!-- Nested dialog: create a new client without leaving the sale form -->
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

    <AppDialog v-model="SaleCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="SaleCrud.selectedItem.value"
        title="עריכת מכירה"
        submit-text="עדכן מכירה"
        :loading="SaleCrud.isUpdating.value"
        :fields="SaleCrud.saleFields.value"
        :initial-values="SaleCrud.saleUpdateInitial.value"
        show-cancel
        @submit="SaleCrud.handleUpdate"
        @cancel="SaleCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <AppDialog
      v-model="SaleCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת מכירה"
      :item-name="SaleCrud.selectedItem.value ? SaleCrud.selectedItem.value.name : ''"
      :loading="SaleCrud.isDeleting.value"
      @confirm="SaleCrud.handleDelete"
      @cancel="SaleCrud.deleteDialogOpen.value = false"
    />

    <!-- Summary by Month Dialog -->
    <AppDialog v-model="summaryDialogOpen" type="raw">
      <v-card class="pa-2 rounded-lg" width="100%">
        <v-card-title class="text-h5 font-weight-bold pa-4"> בחר חודש </v-card-title>
        <v-card-text>
          <div class="mb-4">בחר חודש ושנה להורדת סיכום המכירות:</div>
          <AppInput v-model="summaryMonthYear" label="חודש ושנה" type="month" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <AppButton variant="text" @click="summaryDialogOpen = false"> ביטול </AppButton>
          <AppButton color="primary" variant="elevated" @click="viewSummary"> צפה בו </AppButton>
        </v-card-actions>
      </v-card>
    </AppDialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Import stores
import { SalesStore, ClientsStore } from '@stores'

// Import composables
import { useSaleCrud } from '@sale/composables/sale.crud'
import { useClientCrud } from '@client/composables/client.crud'
import { useCalendarFilter } from '@shared/composables/useCalendarFilter.composable'

// Import custom components
import SaleCard from '@sale/components/SaleCard.vue'
import AppCalendar from '@shared/components/data/AppCalendar.vue'
import AppFilter from '@shared/components/forms/AppFilter.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import AppInput from '@shared/components/input/AppInput.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import GlobalLoading from '@shared/components/feedback/GlobalLoading.vue'

import { UserRole } from '@auth/types/IUser.types'
import type { ISale } from '@sale/types/ISale.types'
import type { ICreateClient } from '@client/types/IClient.types'

const router = useRouter()
const salesStore = SalesStore()
const clientsStore = ClientsStore()

const { sales, loading, filters } = storeToRefs(salesStore)

const SaleCrud = useSaleCrud(salesStore)
const ClientCrud = useClientCrud()

// Summary by month dialog state
const summaryDialogOpen = ref(false)
const summaryMonthYear = ref(new Date().toISOString().slice(0, 7))

const viewSummary = () => {
  summaryDialogOpen.value = false
  router.push({ name: 'sale-summary', query: { monthYear: summaryMonthYear.value } })
}

// --- Inline "add new client" from the sale form's client dropdown ---
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

// Sale form awaiting the freshly created client's id
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
  // Auto-select the newly created client in the sale form
  const created = await ClientCrud.handleCreate(payload)
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
} = useCalendarFilter(salesStore, SaleCrud.fetchSales)

const displayedSales = computed<ISale[]>(() => getFilteredItems(sales.value) as ISale[])

// Sale -> generic calendar item mapping (no legend for sales)
const calendarItems = computed(() =>
  (sales.value || []).map((s) => ({ id: s.id, dateKey: s.datetime.slice(0, 10), tooltip: s.name })),
)
</script>

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
