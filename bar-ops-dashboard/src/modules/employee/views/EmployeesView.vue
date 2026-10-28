<template>
  <v-container>
    <PageHeader
      v-model="query"
      :path="['בית', 'עובדים']"
      title="עובדים"
      desc="ניהול רשימת העובדים והרשאותיהם"
      search-label="חפש עובד לפי שם או תז..."
      :min-role="UserRole.ADMIN"
      :actions="pageActions"
    />

    <div class="mt-6">
      <AppTable
        :headers="tableHeaders"
        :items="results"
        :loading="loading"
        empty-icon="mdi-account-group-outline"
        empty-feature="עובדים"
      >
        <template #name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar color="primary" size="32">
              <span class="text-caption">{{
                ((item.firstName as string)?.charAt(0) || '') +
                ((item.lastName as string)?.charAt(0) || '')
              }}</span>
            </v-avatar>
            <div class="d-flex flex-column">
              <div class="d-flex align-center ga-2 lh-1">
                <span class="font-weight-bold">{{ item.firstName }} {{ item.lastName }}</span>
                <a
                  v-if="typeof item.instagram === 'string' && item.instagram.trim().length > 0"
                  :href="`https://instagram.com/${item.instagram.replace('@', '')}`"
                  target="_blank"
                  class="d-flex align-center social-link"
                  title="אינסטגרם"
                >
                  <img
                    :src="instagramIcon"
                    alt="Instagram"
                    width="18"
                    height="18"
                    class="social-icon hover-grow"
                  />
                </a>
              </div>
              <span class="text-caption text-medium-emphasis">{{ item.identityNumber }}</span>
            </div>
          </div>
        </template>

        <template #type="{ value }">
          <v-chip v-if="value" size="small" variant="tonal" color="primary">
            {{ EmployeeTypeLabels[value as EmployeeType] }}
          </v-chip>
          <span v-else class="text-disabled">—</span>
        </template>

        <template #level="{ value }">
          <v-chip
            v-if="value"
            size="small"
            variant="tonal"
            :color="EmployeeLevelColors[value as EmployeeLevel]"
            :prepend-icon="EmployeeLevelIcons[value as EmployeeLevel]"
          >
            {{ EmployeeLevelLabels[value as EmployeeLevel] }}
          </v-chip>
          <span v-else class="text-disabled">—</span>
        </template>

        <template #phone="{ value }">
          <div class="d-flex align-center justify-start ga-2 lh-1">
            <a :href="`tel:${value}`" class="text-decoration-none text-inherit font-weight-medium">
              {{ formatPhoneNumber(value as string) }}
            </a>
            <a
              v-if="value"
              :href="getWhatsAppUrl(value as string)"
              target="_blank"
              class="d-flex align-center social-link"
              title="שלח הודעה בוואטסאפ"
            >
              <img
                :src="whatsappIcon"
                alt="WhatsApp"
                width="18"
                height="18"
                class="social-icon hover-grow"
              />
            </a>
          </div>
        </template>

        <template #missing="{ item }">
          <v-chip
            v-if="getMissingFields(item as unknown as IEmployee).length"
            size="small"
            variant="tonal"
            color="error"
            prepend-icon="mdi-alert-circle-outline"
          >
            חסרים {{ getMissingFields(item as unknown as IEmployee).length }}
            <v-tooltip activator="parent" location="top">
              {{ getMissingFields(item as unknown as IEmployee).join(', ') }}
            </v-tooltip>
          </v-chip>
          <v-icon v-else color="success" size="20" icon="mdi-check-circle-outline" />
        </template>

        <template #actions="{ item }">
          <AuthWrapper :level="UserRole.ADMIN">
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
              <AppList :actions="itemMenuActions(item as unknown as IEmployee)" />
            </v-menu>
          </AuthWrapper>
        </template>
      </AppTable>
    </div>

    <!-- Create Dialog -->
    <AppDialog v-model="EmployeeCrud.createDialogOpen.value" type="raw">
      <GenericForm
        title="יצירת עובד חדש"
        submit-text="צור עובד"
        :loading="EmployeeCrud.isCreating.value"
        :fields="EmployeeCrud.employeeFields"
        :initial-values="EmployeeCrud.employeeInitialState"
        show-reset
        @submit="EmployeeCrud.handleCreate"
      />
    </AppDialog>

    <!-- Update Dialog -->
    <AppDialog v-model="EmployeeCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="EmployeeCrud.selectedItem.value"
        title="עריכת עובד"
        submit-text="עדכן עובד"
        :loading="EmployeeCrud.isUpdating.value"
        :fields="EmployeeCrud.employeeFields"
        :initial-values="EmployeeCrud.selectedItem.value"
        show-cancel
        @submit="EmployeeCrud.handleUpdate"
        @cancel="EmployeeCrud.updateDialogOpen.value = false"
      />
    </AppDialog>

    <!-- Delete Dialog -->
    <AppDialog
      v-model="EmployeeCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת עובד"
      :item-name="
        EmployeeCrud.selectedItem.value
          ? `${EmployeeCrud.selectedItem.value.firstName} ${EmployeeCrud.selectedItem.value.lastName}`
          : ''
      "
      :loading="EmployeeCrud.isDeleting.value"
      @confirm="EmployeeCrud.handleDelete"
      @cancel="EmployeeCrud.deleteDialogOpen.value = false"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { WHATSAPP_SERVICE_ENABLED, WHATSAPP_UNAVAILABLE_MESSAGE } from '@shared/utils/whatsapp.util'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import whatsappIcon from '@assets/whatsapp.png'
import instagramIcon from '@assets/instagram.png'

import { EmployeesStore, AuthStore } from '@stores'

import { UserRole } from '@auth/types/IUser.types'
import { EmployeeType, EmployeeTypeLabels } from '@employee/types/EmployeeType.types'
import { EmployeeStatus } from '@employee/types/EmployeeStatus.types'
import {
  EmployeeLevel,
  EmployeeLevelColors,
  EmployeeLevelIcons,
  EmployeeLevelLabels,
} from '@employee/types/EmployeeLevel.types'
import type { IEmployee } from '@employee/types/IEmployee.types'
import type { IListAction } from '@shared/types/IListAction.types'

import { useEmployeeCrud } from '@employee/composables/employee.crud'
import { useSearch } from '@shared/composables/useSearch.composable'

import { formatPhoneNumber, getWhatsAppUrl } from '@shared/utils/formatters.util'
import { getMissingFields } from '@employee/utils/missingFields.util'

import AppTable, { type TableHeader } from '@shared/components/data/AppTable.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import AuthWrapper from '@auth/components/AuthWrapper.vue'

const employeesStore = EmployeesStore()
const authStore = AuthStore()
const { employees, loading } = storeToRefs(employeesStore)
const { isAdmin } = storeToRefs(authStore)

// Router
const router = useRouter()
const menuStates = ref<Record<string, boolean>>({})

const tableHeaders: TableHeader<IEmployee>[] = [
  {
    key: 'name',
    label: 'שם העובד',
    exportValue: (item) => `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
  },
  {
    key: 'type',
    label: 'תפקיד',
    exportValue: (item) =>
      item.type ? (EmployeeTypeLabels[item.type as EmployeeType] ?? item.type) : '',
  },
  {
    key: 'level',
    label: 'דירוג',
    exportValue: (item) =>
      item.level ? (EmployeeLevelLabels[item.level as EmployeeLevel] ?? item.level) : '',
  },
  {
    key: 'phone',
    label: 'טלפון',
    exportValue: (item) => (item.phone ? formatPhoneNumber(item.phone as string) : ''),
  },
  {
    key: 'address',
    label: 'כתובת',
    exportValue: (item) => item.address ?? '',
  },
  {
    key: 'missing',
    label: 'פרטים חסרים',
    exportValue: (item) => getMissingFields(item).join(', '),
  },
  { key: 'actions', label: '' },
]

// PageHeader actions - only show to admins
const pageActions = computed(() => {
  if (!isAdmin.value) return []
  return [
    // Team management
    [
      {
        label: 'הוסף עובד',
        action: () => (EmployeeCrud.createDialogOpen.value = true),
        icon: 'mdi-account-plus',
      },
      {
        label: 'בקשות הצטרפות',
        action: () => router.push({ name: 'pending-list' }),
        icon: 'mdi-account-clock',
        color: 'secondary',
      },
    ],
    // Rating
    [
      {
        label: 'דרג עובדים',
        action: () => router.push({ name: 'employee-rate' }),
        icon: 'mdi-account-star-outline',
      },
    ],
    // Messaging
    [
      {
        label: 'שידור הודעות',
        action: () => router.push({ name: 'employee-templates' }),
        icon: 'mdi-message-text-outline',
      },
    ],
  ]
})

// Filter out pending employees
const approvedEmployees = computed(() => {
  return (employees.value || []).filter((e) => Boolean(e) && e.status !== EmployeeStatus.PENDING)
})

// Modular client-side search
const { query, results } = useSearch(approvedEmployees, ['firstName', 'lastName', 'identityNumber'])

const EmployeeCrud = useEmployeeCrud()

// Menu actions — destructive actions sit in own group
const itemMenuActions = (employee: IEmployee): IListAction[][] => [
  [
    {
      title: 'צפה בפרטי עובד',
      icon: 'mdi-account-details-outline',
      handler: () => router.push({ name: 'employee-details', params: { id: employee.id } }),
    },
    { title: 'עדכן', icon: 'mdi-pencil', handler: () => EmployeeCrud.openUpdate(employee) },
    {
      title: WHATSAPP_SERVICE_ENABLED ? 'שלח קישור' : `שלח קישור - ${WHATSAPP_UNAVAILABLE_MESSAGE}`,
      icon: 'mdi-whatsapp',
      disabled: !WHATSAPP_SERVICE_ENABLED,
      loading: EmployeeCrud.sendingLinkId.value === employee.id,
      handler: () => EmployeeCrud.handleSendLink(employee),
    },
  ],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => EmployeeCrud.openDelete(employee) }],
]

</script>

<style scoped>
.hover-grow {
  transition: transform 0.2s ease-in-out;
}
.hover-grow:hover {
  transform: scale(1.25);
}
.social-icon {
  display: block;
}
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: none;
  border: none;
  cursor: pointer;
  vertical-align: middle;
  line-height: 1;
  transform: translateY(3px); /* Shift down to align with Hebrew font baseline */
}

/* Tight line-height for name/phone cells */
.lh-1 {
  line-height: 1;
}
</style>
