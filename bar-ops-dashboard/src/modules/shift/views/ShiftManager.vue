<template>
  <v-col>
    <!-- Title, pending requests and actions share one row -->
    <PageHeader
      :path="[]"
      title="ניהול משמרות"
      desc="ניהול רשימת המשמרות, שיבוץ עובדים ובונוסים"
      :min-role="UserRole.MANAGER"
    >
      <template #actions>
        <auth-wrapper :level="UserRole.MANAGER">
          <!-- Reversed so the buttons run left to right in the RTL layout -->
          <div v-if="!selectMode" class="d-flex flex-row-reverse align-center ga-2">
            <v-menu>
              <template #activator="{ props }">
                <AppButton
                  variant="tonal"
                  color="primary"
                  size="large"
                  append-icon="mdi-chevron-down"
                  rounded="lg"
                  class="font-weight-bold"
                  v-bind="props"
                >
                  פעולות
                </AppButton>
              </template>
              <AppList :actions="shiftMenuActions" density="default" />
            </v-menu>

            <!-- Pending self-registrations; counter sits half over the button's corner -->
            <v-badge
              v-if="allShifts.length > 0"
              :model-value="pendingShifts.length > 0"
              :content="pendingCountLabel"
              color="warning"
            >
              <AppButton
                variant="text"
                color="warning"
                size="large"
                rounded="lg"
                :aria-label="`בקשות משמרת: ${pendingCountLabel}`"
                @click="pendingDialogOpen = true"
              >
                <v-icon size="30">mdi-account-clock</v-icon>
                <v-tooltip activator="parent" location="top" text="בקשות משמרת" />
              </AppButton>
            </v-badge>
          </div>
        </auth-wrapper>
      </template>
    </PageHeader>

    <!-- Same width as the header -->
    <v-container v-if="selectMode" class="py-0">
      <auth-wrapper :level="UserRole.MANAGER">
        <v-row dense class="mb-4">
          <v-col cols="4">
            <AppButton
              block
              variant="tonal"
              color="grey-darken-1"
              size="large"
              prepend-icon="mdi-close"
              rounded="lg"
              class="font-weight-bold"
              @click="disableSelectMode"
            >
              בטל ({{ selectedIds.size }})
            </AppButton>
          </v-col>
          <v-col cols="4">
            <AppButton
              block
              variant="outlined"
              color="primary"
              size="large"
              :prepend-icon="
                isAllSelected ? 'mdi-checkbox-blank-off-outline' : 'mdi-checkbox-multiple-marked'
              "
              rounded="lg"
              class="font-weight-bold"
              @click="toggleSelectAll"
            >
              {{ isAllSelected ? 'בטל בחירה' : 'בחר הכל' }}
            </AppButton>
          </v-col>
          <v-col cols="4">
            <v-menu>
              <template #activator="{ props }">
                <AppButton
                  block
                  variant="tonal"
                  color="primary"
                  size="large"
                  append-icon="mdi-chevron-down"
                  rounded="lg"
                  class="font-weight-bold"
                  v-bind="props"
                  :disabled="selectedIds.size === 0"
                  :loading="isBulkApproving || isBulkUnapproving || isBulkDeleting"
                >
                  פעולות
                </AppButton>
              </template>
              <AppList :actions="bulkMenuActions" density="default" />
            </v-menu>
          </v-col>
        </v-row>
      </auth-wrapper>
    </v-container>

    <v-container v-if="shifts.length === 0">
      <EmptyState icon="mdi-calendar-clock" feature="משמרות">
        <auth-wrapper :level="UserRole.MANAGER">
          <AppButton
            block
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            rounded="lg"
            class="font-weight-bold"
            @click="ShiftCrud.createDialogOpen.value = true"
          >
            הוסף משמרת
          </AppButton>
        </auth-wrapper>
      </EmptyState>
    </v-container>

    <template v-else>
      <search-bar v-model="searchQuery" label="חפש לפי שם עובד..." class="mb-4" />

      <shifts-summary />

      <shift-notes-summary />

      <v-container v-if="!hasFilteredShifts" class="px-0">
        <EmptyState icon="mdi-account-search-outline" feature="עובדים תואמים" />
      </v-container>

      <v-container
        v-for="(groupShifts, role) in groupedShifts"
        v-else
        :key="role"
        class="px-0 pb-8"
      >
        <v-col v-if="groupShifts.length > 0">
          <h3 class="text-h5 font-weight-bold mb-4 border-s-lg border-primary ps-3">
            {{ ShiftRoleLabels[role as ShiftRole] }}
          </h3>
          <v-row dense>
            <v-col v-for="shift in groupShifts" :key="shift.id" cols="12">
              <shift-row
                :shift="shift"
                :loading="togglingIds.has(shift.id)"
                :select-mode="selectMode"
                :selected="selectedIds.has(shift.id)"
                @edit="ShiftCrud.openUpdate(shift)"
                @delete="ShiftCrud.openDelete(shift)"
                @open-intervals="openIntervals(shift)"
                @toggle-approved="toggleApproved"
                @select="toggleSelection"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-container>
    </template>

    <!-- Dialogs Wrapper -->
    <ShiftDialogs
      :ShiftCrud="ShiftCrud"
      :sessionId="sessionStore.session?.id || ''"
      v-model:intervalDialogOpen="intervalDialogOpen"
      v-model:intervalShift="intervalShift"
      v-model:createOpen="ShiftCrud.createDialogOpen.value"
      v-model:updateOpen="ShiftCrud.updateDialogOpen.value"
      v-model:deleteOpen="ShiftCrud.deleteDialogOpen.value"
    />

    <ShiftPendingDialog
      v-model="pendingDialogOpen"
      :shifts="allShifts"
      :loading-ids="registeringIds"
      @approve="(shift) => setRegistration(shift, ShiftRegistration.APPROVED)"
      @reject="(shift) => setRegistration(shift, ShiftRegistration.REJECTED)"
    />

    <!-- Bulk Delete Confirmation Dialog -->
    <AppDialog
      v-model="bulkDeleteOpen"
      type="delete"
      title="מחיקת משמרות מרובות"
      :item-name="`משמרות שבחרת (${selectedIds.size})`"
      :loading="isBulkDeleting"
      @confirm="handleBulkDelete"
      @cancel="bulkDeleteOpen = false"
    />
  </v-col>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { WHATSAPP_SERVICE_ENABLED, WHATSAPP_UNAVAILABLE_MESSAGE } from '@shared/utils/whatsapp.util'
import { useRouter, useRoute } from 'vue-router'

import { SessionStore, EmployeesStore, SnackbarStore } from '@stores'
import { useShiftCrud } from '@shift/composables/shift.crud'
import { shiftProvider } from '@shift/providers/shift.provider'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'

import AuthWrapper from '@auth/components/AuthWrapper.vue'
import EmptyState from '@shared/components/data/EmptyState.vue'
import ShiftRow from '@shift/components/ShiftRow.vue'
import ShiftsSummary from '@shift/components/ShiftsSummary.vue'
import ShiftNotesSummary from '@shift/components/ShiftNotesSummary.vue'
import PageHeader from '@shared/components/layout/PageHeader.vue'
import ShiftDialogs from '@shift/components/ShiftDialogs.vue'
import ShiftPendingDialog from '@shift/components/ShiftPendingDialog.vue'
import SearchBar from '@shared/components/forms/SearchBar.vue'

import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import { ShiftRegistration } from '@shift/types/ShiftRegistration.types'
import type { IShift } from '@shift/types/IShift.types'
import type { IListAction } from '@shared/types/IListAction.types'
import { UserRole } from '@auth/types/IUser.types'

const router = useRouter()
const route = useRoute()
const sessionStore = SessionStore()
const employeesStore = EmployeesStore()

const allShifts = computed(() => sessionStore.shifts?.data || [])

// Regular rows show only registered shifts
const shifts = computed(() => sessionStore.registeredShifts)
const pendingShifts = computed(() =>
  allShifts.value.filter((s) => s.registration === ShiftRegistration.PENDING),
)
const pendingCountLabel = computed(() =>
  pendingShifts.value.length > 99 ? '+99' : String(pendingShifts.value.length),
)

// Search shifts by assigned employee's full name
const searchQuery = ref('')
const filteredShifts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return shifts.value
  return shifts.value.filter((shift) => {
    const emp = employeesStore.get(shift.employeeId)
    if (!emp) return false
    return `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q)
  })
})
const hasFilteredShifts = computed(() => filteredShifts.value.length > 0)

const groupedShifts = computed(() => {
  const groups: Record<string, IShift[]> = {
    [ShiftRole.BAR_MANAGER]: [],
    [ShiftRole.BARTENDER]: [],
    [ShiftRole.WAITER_MANAGER]: [],
    [ShiftRole.WAITER]: [],
    [ShiftRole.RUNNER]: [],
  }
  for (const shift of filteredShifts.value) {
    groups[shift.role]?.push(shift)
  }
  return groups
})

const ShiftCrud = useShiftCrud(sessionStore.shifts)

const togglingIds = ref(new Set<string>())

const toggleApproved = async (shift: IShift) => {
  if (togglingIds.value.has(shift.id)) return
  togglingIds.value.add(shift.id)
  try {
    await ShiftCrud.toggleApproved(shift)
  } finally {
    togglingIds.value.delete(shift.id)
  }
}

// Pending registrations dialog
const pendingDialogOpen = ref(false)
const registeringIds = ref(new Set<string>())

const setRegistration = async (shift: IShift, registration: ShiftRegistration) => {
  if (registeringIds.value.has(shift.id)) return
  registeringIds.value.add(shift.id)
  try {
    await ShiftCrud.setRegistration(shift, registration)
  } finally {
    registeringIds.value.delete(shift.id)
  }
}

const intervalDialogOpen = ref(false)
const intervalShift = ref<IShift | null>(null)
const openIntervals = (shift: IShift) => {
  intervalShift.value = shift
  intervalDialogOpen.value = true
}

// Bulk selection and action states
const selectMode = ref(false)
const selectedIds = ref(new Set<string>())
const isBulkApproving = ref(false)
const isBulkUnapproving = ref(false)
const isBulkDeleting = ref(false)
const bulkDeleteOpen = ref(false)

const enableSelectMode = () => {
  selectMode.value = true
  selectedIds.value.clear()
}

const disableSelectMode = () => {
  selectMode.value = false
  selectedIds.value.clear()
}

const toggleSelection = (shift: IShift) => {
  if (selectedIds.value.has(shift.id)) {
    selectedIds.value.delete(shift.id)
  } else {
    selectedIds.value.add(shift.id)
  }
}

const isAllSelected = computed(() => {
  if (filteredShifts.value.length === 0) return false
  return filteredShifts.value.every((shift) => selectedIds.value.has(shift.id))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    filteredShifts.value.forEach((shift) => {
      selectedIds.value.delete(shift.id)
    })
  } else {
    filteredShifts.value.forEach((shift) => {
      selectedIds.value.add(shift.id)
    })
  }
}

const bulkApprove = async () => {
  const idsToApprove = Array.from(selectedIds.value)
  if (idsToApprove.length === 0) return

  isBulkApproving.value = true
  const targetShifts = shifts.value.filter((s) => idsToApprove.includes(s.id))

  let successCount = 0
  let failCount = 0

  try {
    await Promise.all(
      targetShifts.map(async (shift) => {
        if (shift.approved) {
          successCount++
          return
        }
        const payload = {
          id: shift.id,
          timestamp: shift.timestamp,
          approved: true,
        }
        const result = await shiftProvider.update(shift.id, payload)
        if (result.success && result.data) {
          sessionStore.shifts.update(result.data)
          successCount++
        } else {
          failCount++
        }
      }),
    )

    if (successCount > 0) {
      SnackbarStore().open(`אושר בהצלחה: ${successCount} משמרות`, 'success')
    }
    if (failCount > 0) {
      SnackbarStore().open(`נכשל עדכון עבור ${failCount} משמרות`, 'error')
    }
  } catch {
    SnackbarStore().open('שגיאה בלתי צפויה באישור המשמרות', 'error')
  } finally {
    isBulkApproving.value = false
    disableSelectMode()
  }
}

const bulkUnapprove = async () => {
  const idsToUnapprove = Array.from(selectedIds.value)
  if (idsToUnapprove.length === 0) return

  isBulkUnapproving.value = true
  const targetShifts = shifts.value.filter((s) => idsToUnapprove.includes(s.id))

  let successCount = 0
  let failCount = 0

  try {
    await Promise.all(
      targetShifts.map(async (shift) => {
        if (!shift.approved) {
          successCount++
          return
        }
        const payload = {
          id: shift.id,
          timestamp: shift.timestamp,
          approved: false,
        }
        const result = await shiftProvider.update(shift.id, payload)
        if (result.success && result.data) {
          sessionStore.shifts.update(result.data)
          successCount++
        } else {
          failCount++
        }
      }),
    )

    if (successCount > 0) {
      SnackbarStore().open(`ביטול אישור בוצע בהצלחה: ${successCount} משמרות`, 'success')
    }
    if (failCount > 0) {
      SnackbarStore().open(`נכשל ביטול אישור עבור ${failCount} משמרות`, 'error')
    }
  } catch {
    SnackbarStore().open('שגיאה בלתי צפויה בביטול אישור המשמרות', 'error')
  } finally {
    isBulkUnapproving.value = false
    disableSelectMode()
  }
}

// Default (non-select-mode) shift actions menu. Adding and broadcasting always work;
// selecting only appears once there is something to select
const shiftMenuActions = computed<IListAction[][]>(() => {
  const actions: IListAction[] = [
    {
      title: 'הוסף משמרת',
      icon: 'mdi-plus',
      handler: () => (ShiftCrud.createDialogOpen.value = true),
    },
  ]

  if (shifts.value.length > 0) {
    actions.push(
      {
        title: 'בחר',
        icon: 'mdi-checkbox-multiple-marked-outline',
        handler: () => enableSelectMode(),
      },
      {
        title: 'לוח הגעות',
        icon: 'mdi-timeline-clock-outline',
        handler: () =>
          router.push({
            name: 'shift-arrivals',
            params: { clientId: route.params.clientId, id: route.params.id },
          }),
      },
    )
  }

  actions.push({
    title: WHATSAPP_SERVICE_ENABLED ? 'שלח שידור' : `שלח שידור - ${WHATSAPP_UNAVAILABLE_MESSAGE}`,
    icon: 'mdi-bullhorn-outline',
    disabled: !WHATSAPP_SERVICE_ENABLED,
    handler: () =>
      router.push({
        name: 'shift-broadcast',
        params: { clientId: route.params.clientId, id: route.params.id },
      }),
  })

  return [actions]
})

// Bulk menu actions — destructive actions sit in their own group
const bulkMenuActions: IListAction[][] = [
  [
    { title: 'אשר', icon: 'mdi-check-decagram', handler: () => bulkApprove() },
    { title: 'בטל אישור', icon: 'mdi-minus-circle-outline', handler: () => bulkUnapprove() },
  ],
  [{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => openBulkDeleteConfirm() }],
]

const openBulkDeleteConfirm = () => {
  bulkDeleteOpen.value = true
}

const handleBulkDelete = async () => {
  const idsToDelete = Array.from(selectedIds.value)
  if (idsToDelete.length === 0) return

  isBulkDeleting.value = true
  let successCount = 0
  let failCount = 0

  try {
    await Promise.all(
      idsToDelete.map(async (id) => {
        const result = await shiftProvider.delete(id)
        if (result.success) {
          sessionStore.shifts.remove(id)
          successCount++
        } else {
          failCount++
        }
      }),
    )

    if (successCount > 0) {
      SnackbarStore().open(`נמחקו בהצלחה: ${successCount} משמרות`, 'success')
    }
    if (failCount > 0) {
      SnackbarStore().open(`שגיאה במחיקת ${failCount} משמרות`, 'error')
    }
  } catch {
    SnackbarStore().open('שגיאה בלתי צפויה במחיקת המשמרות', 'error')
  } finally {
    isBulkDeleting.value = false
    bulkDeleteOpen.value = false
    disableSelectMode()
  }
}
</script>
