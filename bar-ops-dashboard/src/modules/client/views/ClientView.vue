<template>
  <v-container>
    <PageHeader
      v-model="query"
      :path="['בית', 'לקוחות']"
      title="לקוחות"
      desc="ניהול רשימת הלקוחות והפרטים שלהם"
      search-label="חפש לקוח לפי שם..."
      :min-role="UserRole.MANAGER"
      :actions="pageActions"
    />

    <div class="mt-4">
      <AppTable
        :headers="tableHeaders"
        :items="results"
        :loading="loading"
        empty-icon="mdi-account-multiple-outline"
        empty-feature="לקוחות"
      >
        <template #brand="{ value }">
          <span class="font-weight-bold">{{ value }}</span>
        </template>
        <template #email="{ value }">
          {{ value || '—' }}
        </template>
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
            <AppList :actions="itemMenuActions(item as unknown as IClient)" />
          </v-menu>
        </template>
      </AppTable>
    </div>

    <!-- Create Dialog -->
    <AppDialog v-model="ClientCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת לקוח חדש"
        submit-text="צור לקוח"
        :loading="ClientCrud.isCreating.value"
        :fields="ClientCrud.clientFields"
        :initial-values="ClientCrud.clientInitialState"
        show-reset
        @submit="ClientCrud.handleCreate"
      />
    </AppDialog>

    <!-- Update Dialog -->
    <AppDialog v-model="ClientCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="ClientCrud.selectedItem.value"
        title="עריכת לקוח"
        submit-text="עדכן לקוח"
        :loading="ClientCrud.isUpdating.value"
        :fields="ClientCrud.clientFields"
        :initial-values="ClientCrud.selectedItem.value"
        show-cancel
        @submit="ClientCrud.handleUpdate"
        @cancel="ClientCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <!-- Delete Dialog -->
    <AppDialog
      v-model="ClientCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת לקוח"
      :item-name="ClientCrud.selectedItem.value?.name || ''"
      :loading="ClientCrud.isDeleting.value"
      @confirm="ClientCrud.handleDelete"
      @cancel="ClientCrud.deleteDialogOpen.value = false"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ClientsStore, AuthStore } from '@stores'

import { useClientCrud } from '@client/composables/client.crud'
import { useSearch } from '@shared/composables/useSearch.composable'

import { UserRole } from '@auth/types/IUser.types'
import type { IClient } from '@client/types/IClient.types'
import type { IListAction } from '@shared/types/IListAction.types'

import { formatPhoneNumber } from '@shared/utils/formatters.util'

import AppTable from '@shared/components/data/AppTable.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'

const clientsStore = ClientsStore()
const authStore = AuthStore()

// Store state
const { clients, loading } = storeToRefs(clientsStore)
const { isAdmin } = storeToRefs(authStore)
const menuStates = ref<Record<string, boolean>>({})

// PageHeader actions - only show to admins
const pageActions = computed(() => {
  if (!isAdmin.value) return []
  return [
    {
      label: 'הוסף לקוח',
      action: () => (ClientCrud.createDialogOpen.value = true),
      icon: 'mdi-plus',
    },
  ]
})

const tableHeaders = [
  { key: 'brand', label: 'מותג' },
  { key: 'name', label: 'שם הלקוח' },
  { key: 'email', label: 'אימייל' },
  { key: 'phone', label: 'טלפון' },
  { key: 'actions', label: '' },
]

// Modular client-side search
const { query, results } = useSearch(clients, ['name', 'brand'])

// Use the CRUD composable
const ClientCrud = useClientCrud()

// Per-item menu actions; delete is admin-only
const itemMenuActions = (client: IClient): IListAction[][] => {
  const groups: IListAction[][] = [
    [{ title: 'עדכן', icon: 'mdi-pencil', handler: () => ClientCrud.openUpdate(client) }],
  ]
  if (isAdmin.value) {
    groups.push([
      { title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => ClientCrud.openDelete(client) },
    ])
  }
  return groups
}
</script>
