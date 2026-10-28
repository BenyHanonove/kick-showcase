<template>
  <v-container>
    <PageHeader
      v-model="query"
      :path="['בית', 'ספקים']"
      title="ספקים"
      desc="ניהול רשימת הספקים ואנשי הקשר"
      search-label="חפש ספק לפי שם..."
      :min-role="UserRole.MANAGER"
      :actions="pageActions"
    />

    <div class="mt-6">
      <AppTable
        :headers="tableHeaders"
        :items="results"
        :loading="loading"
        empty-icon="mdi-truck-delivery"
        empty-feature="ספקים"
      >
        <template #phone="{ value }">
          <a :href="`tel:${value}`" class="text-decoration-none text-inherit">
            {{ formatPhoneNumber(value as string) }}
          </a>
        </template>

        <template #actions="{ item }">
          <v-menu
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
            <AppList :actions="itemMenuActions(item as unknown as ISupplier)" />
          </v-menu>
        </template>
      </AppTable>
    </div>

    <!-- Create Dialog -->
    <AppDialog v-model="SupplierCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת ספק חדש"
        submit-text="צור ספק"
        :loading="SupplierCrud.isCreating.value"
        :fields="SupplierCrud.supplierFields"
        :initial-values="SupplierCrud.supplierInitialState"
        show-reset
        @submit="SupplierCrud.handleCreate"
      />
    </AppDialog>

    <!-- Update Dialog -->
    <AppDialog v-model="SupplierCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="SupplierCrud.selectedItem.value"
        title="עריכת ספק"
        submit-text="עדכן ספק"
        :loading="SupplierCrud.isUpdating.value"
        :fields="SupplierCrud.supplierFields"
        :initial-values="SupplierCrud.selectedItem.value"
        show-cancel
        @submit="SupplierCrud.handleUpdate"
        @cancel="SupplierCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <!-- Delete Dialog -->
    <AppDialog
      v-model="SupplierCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת ספק"
      :item-name="SupplierCrud.selectedItem.value?.name || ''"
      :loading="SupplierCrud.isDeleting.value"
      @confirm="SupplierCrud.handleDelete"
      @cancel="SupplierCrud.deleteDialogOpen.value = false"
    />

    <!-- Summary Report Dialog -->
    <AppDialog v-model="SupplierCrud.summaryDialogOpen.value" type="raw">
      <v-card class="pa-2 rounded-lg" width="100%">
        <v-card-title class="text-h5 font-weight-bold pa-4"> הורדת דוח חודשי </v-card-title>
        <v-card-text>
          <div class="mb-4">בחר חודש ושנה להורדת פירוט הזמנות והוצאות עבור הספק:</div>
          <AppInput
            v-model="monthYear"
            label="חודש ושנה"
            type="month"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <AppButton variant="text" @click="SupplierCrud.summaryDialogOpen.value = false">
            ביטול
          </AppButton>
          <AppButton
            color="primary"
            variant="elevated"
            :loading="SupplierCrud.isGeneratingSummary.value"
            @click="
              SupplierCrud.handleSummary({
                id: SupplierCrud.summarySupplier.value?.id || '',
                monthYear,
              })
            "
          >
            הורד דוח
          </AppButton>
        </v-card-actions>
      </v-card>
    </AppDialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

// Import stores
import { SuppliersStore, AuthStore } from '@stores'

// Import types
import { UserRole } from '@auth/types/IUser.types'
import type { ISupplier } from '@supplier/types/ISupplier.types'
import type { IListAction } from '@shared/types/IListAction.types'

// Import composables
import { useSupplierCrud } from '@supplier/composables/supplier.crud'
import { useSearch } from '@shared/composables/useSearch.composable'

// Import utils
import { formatPhoneNumber } from '@shared/utils/formatters.util'

// Import custom components
import AppTable from '@shared/components/data/AppTable.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import AppInput from '@shared/components/input/AppInput.vue'

// Initialize stores
const suppliersStore = SuppliersStore()
const authStore = AuthStore()
const { suppliers, loading } = storeToRefs(suppliersStore)
const { isAdmin } = storeToRefs(authStore)

const menuStates = ref<Record<string, boolean>>({})

// Table headers config
const tableHeaders = computed(() => {
  const headers = [
    { key: 'name', label: 'שם ספק' },
    { key: 'contactName', label: 'איש קשר' },
    { key: 'phone', label: 'טלפון' },
    { key: 'address', label: 'כתובת' },
    { key: 'notes', label: 'הערות' },
  ]
  if (isAdmin.value) {
    headers.push({ key: 'actions', label: '' })
  }
  return headers
})

// PageHeader actions - only show "add" button to admins
const pageActions = computed(() => {
  if (!isAdmin.value) return []
  return [
    {
      label: 'הוסף ספק',
      action: () => (SupplierCrud.createDialogOpen.value = true),
      icon: 'mdi-plus',
    },
  ]
})

// Search initialization
const { query, results } = useSearch(suppliers, ['name', 'contactName'])

// MonthYear for summary
const monthYear = ref(new Date().toISOString().slice(0, 7))

// Initialize CRUD actions
const SupplierCrud = useSupplierCrud()

// Per-item menu actions — destructive actions sit in their own group
const itemMenuActions = (supplier: ISupplier): IListAction[][] => [
  [
    { title: 'דוח חודשי', icon: 'mdi-file-document-outline', handler: () => SupplierCrud.openSummary(supplier) },
    { title: 'עדכן', icon: 'mdi-pencil', handler: () => SupplierCrud.openUpdate(supplier) },
  ],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => SupplierCrud.openDelete(supplier) }],
]
</script>
