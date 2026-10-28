<template>
  <v-container>
    <!-- Page header -->
    <PageHeader
      v-model="query"
      :path="['בית', 'עובדים', 'ממתינים']"
      title="רשימת ממתינים"
      desc="אישור, עריכה או מחיקה של עובדים שנרשמו עצמאית במערכת"
      search-label="חפש עובד לפי שם או תז..."
      :min-role="UserRole.ADMIN"
    />

    <!-- Transition group for animations -->
    <v-fade-transition group hide-on-leave>
      <!-- Loading -->
      <v-row v-if="employeesStore.loading" key="loading" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
      </v-row>

      <!-- Empty state -->
      <div v-else-if="results.length === 0" key="empty" class="text-center py-12 mt-6">
        <v-avatar
          size="96"
          :color="hasNoMatches ? 'medium-emphasis' : 'success'"
          variant="tonal"
          class="mb-4"
        >
          <v-icon size="56">{{ hasNoMatches ? 'mdi-account-search-outline' : 'mdi-check-all' }}</v-icon>
        </v-avatar>
        <h3 class="text-h5 font-weight-bold mb-2">
          {{ hasNoMatches ? 'לא נמצאו תוצאות' : 'אין עובדים ממתינים' }}
        </h3>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{
            hasNoMatches
              ? 'לא נמצא עובד ממתין התואם את החיפוש. נסה שם או תעודת זהות אחרים.'
              : 'כל בקשות הרישום טופלו בהצלחה! אין עובדים חדשים שממתינים לאישור בשלב זה.'
          }}
        </p>
      </div>

      <!-- Card Grid -->
      <v-row v-else key="content" class="mt-4">
        <v-col
          v-for="emp in results"
          :key="emp.id"
          cols="12"
          sm="6"
          md="4"
          class="d-flex align-stretch"
        >
          <PendingEmployeeCard
            :employee="emp"
            :is-approving="approvingId === emp.id"
            :is-deleting="
              EmployeeCrud.isDeleting.value && EmployeeCrud.selectedItem.value?.id === emp.id
            "
            :disabled="
              approvingId !== null || EmployeeCrud.isDeleting.value || EmployeeCrud.isUpdating.value
            "
            @approve="handleApprove"
            @edit="EmployeeCrud.openUpdate"
            @delete="openDeleteDialog"
          />
        </v-col>
      </v-row>
    </v-fade-transition>

    <!-- Delete Confirmation Dialog -->
    <AppDialog
      v-model="EmployeeCrud.deleteDialogOpen.value"
      type="delete"
      title="מחיקת עובד"
      :item-name="EmployeeCrud.selectedItem.value ? `${EmployeeCrud.selectedItem.value.firstName} ${EmployeeCrud.selectedItem.value.lastName}` : ''"
      :loading="EmployeeCrud.isDeleting.value"
      @confirm="EmployeeCrud.handleDelete"
      @cancel="EmployeeCrud.deleteDialogOpen.value = false"
    />

    <!-- Edit Dialog -->
    <AppDialog v-model="EmployeeCrud.updateDialogOpen.value" type="raw">
      <GenericForm
        v-if="EmployeeCrud.selectedItem.value && EmployeeCrud.updateDialogOpen.value"
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import PageHeader from '@shared/components/layout/PageHeader.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import PendingEmployeeCard from '../components/PendingEmployeeCard.vue'

import { useSearch } from '@shared/composables/useSearch.composable'
import { useEmployeeCrud } from '@employee/composables/employee.crud'

import { EmployeesStore, SnackbarStore } from '@stores'

import { employeeProvider } from '@employee/providers/employee.provider'

import { UserRole } from '@auth/types/IUser.types'
import { EmployeeStatus } from '@employee/types/EmployeeStatus.types'
import type { IEmployee, IUpdateEmployee } from '@employee/types/IEmployee.types'

// Init stores
const employeesStore = EmployeesStore()
const snackbarStore = SnackbarStore()

// Use composables
const EmployeeCrud = useEmployeeCrud()

// Filter only pending employees from the store
const pendingList = computed(
  () => employeesStore.employees?.filter((e) => e.status === EmployeeStatus.PENDING) ?? [],
)

// Search over the pending list
const { query, results } = useSearch(pendingList, [
  'firstName',
  'lastName',
  'identityNumber',
  'phone',
])

// Distinguish "search found nothing" from "nothing pending at all"
const hasNoMatches = computed(() => !!query.value && pendingList.value.length > 0)

// Approve handler state
const approvingId = ref<string | null>(null)

// Load all employees on mount
onMounted(async () => {
  const result = await employeeProvider.list()
  if (result.success && result.data) {
    employeesStore.set(result.data)
  } else {
    snackbarStore.open(result.message, 'error')
  }
})

// Approve handler — update status to APPROVED
const handleApprove = async (emp: IEmployee) => {
  approvingId.value = emp.id
  try {
    const payload: IUpdateEmployee = {
      id: emp.id,
      timestamp: emp.timestamp,
      status: EmployeeStatus.APPROVED,
    }
    const result = await employeeProvider.update(emp.id, payload)
    if (result.success && result.data) {
      employeesStore.update(result.data)
      snackbarStore.open(result.message, 'success')
    } else {
      snackbarStore.open(result.message, 'error')
    }
  } catch {
    snackbarStore.open('שגיאה באישור העובד', 'error')
  } finally {
    approvingId.value = null
  }
}

// Delete dialog opener — wire into the crud composable's selectedItem
const openDeleteDialog = (emp: IEmployee) => {
  EmployeeCrud.selectedItem.value = emp
  EmployeeCrud.deleteDialogOpen.value = true
}
</script>
