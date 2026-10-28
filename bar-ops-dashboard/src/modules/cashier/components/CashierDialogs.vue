<template>
  <!-- Create Dialog -->
  <AppDialog v-model="createOpen" type="raw">
    <v-card class="rounded-xl overflow-hidden" width="100%">
      <div class="d-flex align-center justify-space-between pa-4 pb-2">
        <v-card-title class="text-h5 font-weight-bold pa-0">הוספת קופה</v-card-title>
        <AppButton icon="mdi-close" variant="text" size="small" @click="createOpen = false" />
      </div>

      <div class="pa-4 pt-0">
        <!-- Mode 1: Z-Report -->
        <v-card variant="flat" class="border rounded-xl mb-3 overflow-hidden">
          <div
            class="d-flex align-center justify-space-between pa-4 cursor-pointer hover-bg transition-colors"
            :class="{ 'bg-primary-lighten-5': activeBlock === 'z' }"
            @click="activeBlock = activeBlock === 'z' ? null : 'z'"
          >
            <div class="d-flex align-center ga-2">
              <v-icon :color="activeBlock === 'z' ? 'primary' : 'medium-emphasis'"
                >mdi-file-excel</v-icon
              >
              <span
                class="font-weight-bold text-subtitle-1"
                :class="{ 'text-primary': activeBlock === 'z' }"
                >משידור Z</span
              >
            </div>
            <v-icon :class="{ 'rotate-180': activeBlock === 'z' }" class="transition-transform"
              >mdi-chevron-down</v-icon
            >
          </div>

          <v-expand-transition>
            <div v-show="activeBlock === 'z'" class="pa-4 border-t">
              <!-- Location Select Segmented Toggle -->
              <div class="mb-4">
                <span class="text-subtitle-2 font-weight-bold text-high-emphasis d-block mb-2"
                  >מיקום קופה:</span
                >
                <v-btn-toggle
                  v-model="zReportLocation"
                  mandatory
                  color="primary"
                  variant="outlined"
                  class="rounded-xl w-100 border location-toggle"
                >
                  <v-btn
                    :value="CashierLocation.BAR"
                    class="flex-grow-1 font-weight-bold rounded-l-0"
                  >
                    <v-icon start>mdi-glass-cocktail</v-icon>
                    בר
                  </v-btn>
                  <v-btn
                    :value="CashierLocation.TABLES"
                    class="flex-grow-1 font-weight-bold rounded-r-0"
                  >
                    <v-icon start>mdi-table-chair</v-icon>
                    שולחנות
                  </v-btn>
                </v-btn-toggle>
              </div>

              <!-- State 1: No files — show drag & drop -->
              <FileDragDrop
                v-if="!isUploadingZReports && uploadedFiles.length === 0"
                v-model:files="uploadedFiles"
              />

              <!-- State 2: Files selected, not yet uploading -->
              <div
                v-else-if="!isUploadingZReports"
                class="d-flex align-center justify-space-between pa-3 rounded-xl border files-selected-bg"
              >
                <div class="d-flex align-center ga-2">
                  <v-icon color="primary">mdi-file-multiple-outline</v-icon>
                  <span class="font-weight-bold text-body-1"
                    >{{ uploadedFiles.length }} קבצים נבחרו</span
                  >
                </div>
                <AppButton
                  icon="mdi-close"
                  variant="text"
                  density="compact"
                  size="small"
                  @click="uploadedFiles = []"
                />
              </div>

              <!-- State 3: Uploading — progress bar -->
              <div v-else class="py-2">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-2 font-weight-bold">טוען קבצים...</span>
                  <span class="text-body-2 text-medium-emphasis">
                    {{ completedCount }} מתוך {{ totalCount }}
                  </span>
                </div>
                <v-progress-linear
                  :model-value="totalCount > 0 ? (completedCount / totalCount) * 100 : 0"
                  color="primary"
                  bg-color="surface-variant"
                  height="10"
                  rounded
                  stream
                />
                <p class="text-caption text-medium-emphasis mt-2 text-center">
                  {{ completedCount === totalCount && totalCount > 0 ? 'מסיים...' : 'אנא המתן' }}
                </p>
              </div>

              <AppButton
                block
                color="primary"
                size="large"
                rounded="lg"
                class="font-weight-bold mt-4"
                prepend-icon="mdi-cloud-upload"
                :loading="isUploadingZReports"
                :disabled="uploadedFiles.length === 0 || isUploadingZReports"
                @click="handleZReportUpload"
              >
                טען דוחות קופה
              </AppButton>
            </div>
          </v-expand-transition>
        </v-card>

        <!-- Mode 2: Manual -->
        <v-card variant="flat" class="border rounded-xl overflow-hidden">
          <div
            class="d-flex align-center justify-space-between pa-4 cursor-pointer hover-bg transition-colors"
            :class="{ 'bg-primary-lighten-5': activeBlock === 'manual' }"
            @click="activeBlock = activeBlock === 'manual' ? null : 'manual'"
          >
            <div class="d-flex align-center ga-2">
              <v-icon :color="activeBlock === 'manual' ? 'primary' : 'medium-emphasis'"
                >mdi-keyboard-outline</v-icon
              >
              <span
                class="font-weight-bold text-subtitle-1"
                :class="{ 'text-primary': activeBlock === 'manual' }"
                >ידנית</span
              >
            </div>
            <v-icon :class="{ 'rotate-180': activeBlock === 'manual' }" class="transition-transform"
              >mdi-chevron-down</v-icon
            >
          </div>

          <v-expand-transition>
            <div v-show="activeBlock === 'manual'" class="pa-0 border-t">
              <GenericForm
                title=""
                submit-text="צור קופה"
                :loading="props.CashierCrud.isCreating.value"
                :fields="props.CashierCrud.cashierFields"
                :initial-values="props.CashierCrud.cashierInitialState(props.sessionId)"
                show-reset
                enable-quantity
                @submit="props.CashierCrud.handleCreate"
              />
            </div>
          </v-expand-transition>
        </v-card>
      </div>
    </v-card>
  </AppDialog>

  <!-- Update Dialog -->
  <AppDialog v-model="updateOpen" type="raw">
    <GenericForm
      v-if="props.CashierCrud.selectedItem.value"
      title="עריכת קופה"
      submit-text="עדכן קופה"
      :loading="props.CashierCrud.isUpdating.value"
      :fields="props.CashierCrud.cashierUpdateFields"
      :initial-values="props.CashierCrud.selectedItem.value"
      show-cancel
      @submit="props.CashierCrud.handleUpdate"
      @cancel="updateOpen = false"
    />
  </AppDialog>

  <!-- Delete Dialog -->
  <AppDialog
    v-model="deleteOpen"
    type="delete"
    title="מחיקת קופה"
    :item-name="props.CashierCrud.selectedItem.value ? `קופה בסך ₪${props.CashierCrud.selectedItem.value.cash + props.CashierCrud.selectedItem.value.credit}` : ''"
    :loading="props.CashierCrud.isDeleting.value"
    @confirm="props.CashierCrud.handleDelete"
    @cancel="deleteOpen = false"
  />

  <!-- Receipt Dialog -->
  <receipt-dialog
    v-model="receiptOpen"
    :title="'ניהול קבלה לקופה'"
    :receipt-url="props.CashierCrud.receiptItem.value?.receiptUrl"
    :loading="props.CashierCrud.isProcessingReceipt.value"
    @upload="props.CashierCrud.handleReceiptUpload"
    @remove="props.CashierCrud.handleReceiptRemove"
  />

  <!-- Bulk Delete Dialog -->
  <AppDialog
    v-model="bulkDeleteOpen"
    type="delete"
    title="מחיקת קופות"
    :item-name="`${selectedIds.length} קופות שנבחרו`"
    :loading="isBulkDeleting"
    @confirm="handleBulkDelete"
    @cancel="bulkDeleteOpen = false"
  >
    <div v-if="selectedGroups.length > 0">
      <span class="text-caption font-weight-bold text-medium-emphasis d-block mb-1">קבוצות:</span>
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="group in selectedGroups"
          :key="group"
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-tag-outline"
        >
          {{ group }}
        </v-chip>
      </div>
    </div>
    <v-chip v-else size="small" variant="tonal" color="medium-emphasis"> ללא קבוצה </v-chip>
  </AppDialog>

  <!-- Bulk Group Update Dialog -->
  <AppDialog v-model="groupUpdateOpen" size="md" title="עדכון קבוצה">
    <div v-if="selectedGroups.length > 0" class="mb-4">
      <span class="text-caption font-weight-bold text-medium-emphasis d-block mb-1"
        >קבוצה נוכחית:</span
      >
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="group in selectedGroups"
          :key="group"
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-tag-outline"
          @click="groupNameInput = group"
        >
          {{ group }}
        </v-chip>
      </div>
    </div>
    <p class="text-body-2 text-medium-emphasis mb-3">
      הזן שם קבוצה חדש עבור {{ selectedIds.length }} קופות שנבחרו:
    </p>
    <AppInput
      v-model="groupNameInput"
      type="text"
      label="שם קבוצה"
      :rules="[rules.required()]"
    />
    <template #actions>
      <v-spacer />
      <AppButton variant="tertiary" @click="groupUpdateOpen = false">ביטול</AppButton>
      <AppButton
        variant="primary"
        :disabled="!groupNameInput.trim()"
        :loading="isBulkUpdating"
        @click="handleBulkGroupUpdate"
      >
        עדכן
      </AppButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import { SessionStore, SnackbarStore } from '@stores'
import { cashierProvider } from '@cashier/providers/cashier.provider'
import { useCashierCrud } from '@cashier/composables/cashier.crud'
import type { IUpdateCashier } from '@cashier/types/ICashier.types'
import { CashierLocation } from '@cashier/types/CashierLocation.types'

import FileDragDrop, { type UploadFileItem } from '@shared/components/input/FileDragDrop.vue'
import GenericForm from '@shared/components/forms/GenericForm.vue'
import AppDialog from '@shared/components/dialogs/AppDialog.vue'
import ReceiptDialog from '@shared/components/dialogs/ReceiptDialog.vue'
import AppInput from '@shared/components/input/AppInput.vue'
import { rules } from '@shared/utils/rules.util'

// Props definition using ReturnType to avoid 'any'
const props = defineProps<{
  CashierCrud: ReturnType<typeof useCashierCrud>
  sessionId: string
}>()

// Model definitions for two-way bindings
const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })
const isSelectMode = defineModel<boolean>('isSelectMode', { default: false })
const bulkDeleteOpen = defineModel<boolean>('bulkDeleteOpen', { default: false })
const groupUpdateOpen = defineModel<boolean>('groupUpdateOpen', { default: false })

const createOpen = defineModel<boolean>('createOpen', { default: false })
const updateOpen = defineModel<boolean>('updateOpen', { default: false })
const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })
const receiptOpen = defineModel<boolean>('receiptOpen', { default: false })

// Internal states
const isBulkDeleting = ref(false)
const isBulkUpdating = ref(false)
const groupNameInput = ref('')

// Computed: cashiers and groups for selected IDs
const selectedCashiers = computed(() =>
  (sessionStore.cashiers?.data || []).filter((c) => selectedIds.value.includes(c.id)),
)

const selectedGroups = computed(() => {
  const groups = new Set(
    selectedCashiers.value.map((c) => c.group).filter((g): g is string => Boolean(g)),
  )
  return [...groups]
})

const activeBlock = ref<'z' | 'manual' | null>(null)
const uploadedFiles = ref<UploadFileItem[]>([])
const zReportLocation = ref<CashierLocation>(CashierLocation.BAR)
const isUploadingZReports = ref(false)
const completedCount = ref(0)
const totalCount = ref(0)

const sessionStore = SessionStore()
const snackbarStore = SnackbarStore()

// Reset active block and files queue on open
watch(createOpen, (isOpen) => {
  if (isOpen) {
    activeBlock.value = null
    uploadedFiles.value = []
  }
})

// Pre-fill group name if all selected share one
watch(groupUpdateOpen, (isOpen) => {
  if (isOpen) {
    groupNameInput.value = selectedGroups.value.length === 1 ? (selectedGroups.value[0] ?? '') : ''
  }
})

// Bulk actions handlers
const handleBulkDelete = async () => {
  isBulkDeleting.value = true
  try {
    const promises = selectedIds.value.map((id) => cashierProvider.delete(id))
    const results = await Promise.all(promises)

    let successCount = 0
    selectedIds.value.forEach((id, index) => {
      const res = results[index]
      if (res && res.success) {
        sessionStore.cashiers.remove(id)
        successCount++
      }
    })

    snackbarStore.open(`נמחקו בהצלחה ${successCount} קופות`, 'success')
    selectedIds.value = []
    isSelectMode.value = false
    bulkDeleteOpen.value = false
  } catch (error) {
    let message = 'ארעה שגיאה במחיקת הקופות'
    if (error instanceof Error) message = error.message
    snackbarStore.open(message, 'error')
  } finally {
    isBulkDeleting.value = false
  }
}

const handleBulkGroupUpdate = async () => {
  if (!groupNameInput.value.trim()) return

  isBulkUpdating.value = true
  try {
    const currentItems = sessionStore.cashiers?.data || []

    // Filter the cashiers that are currently selected
    const selectedCashiers = currentItems.filter((c) => selectedIds.value.includes(c.id))

    // For each, perform update
    const promises = selectedCashiers.map((cashier) => {
      const payload: Partial<IUpdateCashier> = {
        id: cashier.id,
        timestamp: cashier.timestamp,
        group: groupNameInput.value.trim(),
      }
      return cashierProvider.update(cashier.id, payload as IUpdateCashier)
    })

    const results = await Promise.all(promises)

    let successCount = 0
    selectedCashiers.forEach((cashier, index) => {
      const res = results[index]
      if (res && res.success && res.data) {
        const updatedItem = {
          ...res.data,
          group: groupNameInput.value.trim(),
        }
        sessionStore.cashiers.update(updatedItem)
        successCount++
      }
    })

    snackbarStore.open(`עודכנה קבוצה עבור ${successCount} קופות בהצלחה`, 'success')
    selectedIds.value = []
    isSelectMode.value = false
    groupUpdateOpen.value = false
  } catch (error) {
    let message = 'ארעה שגיאה בעדכון הקבוצה'
    if (error instanceof Error) message = error.message
    snackbarStore.open(message, 'error')
  } finally {
    isBulkUpdating.value = false
  }
}

const handleZReportUpload = async () => {
  if (uploadedFiles.value.length === 0) {
    snackbarStore.open('אנא בחר לפחות קובץ CSV אחד', 'warning')
    return
  }

  const pendingFiles = uploadedFiles.value.filter((f) => f.status !== 'success')
  if (pendingFiles.length === 0) return

  isUploadingZReports.value = true
  completedCount.value = 0
  totalCount.value = pendingFiles.length

  const results = await Promise.allSettled(
    pendingFiles.map(async (item) => {
      const result = await cashierProvider.createFromZReport({
        file: item.base64,
        sessionId: props.sessionId,
        location: zReportLocation.value,
        filename: item.file.name,
      })
      completedCount.value++
      return result
    }),
  )

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  results.forEach((outcome, index) => {
    const item = pendingFiles[index]
    if (!item) return

    if (outcome.status === 'fulfilled') {
      const result = outcome.value
      if (result.success && result.data) {
        sessionStore.cashiers.add(result.data)
        successCount++
      } else {
        errorCount++
        errors.push(result.message || 'שגיאה בלתי צפויה')
      }
    } else {
      errorCount++
      const reason = outcome.reason
      const msg = reason instanceof Error ? reason.message : String(reason)
      errors.push(msg || 'שגיאה בלתי צפויה')
    }
  })

  isUploadingZReports.value = false

  if (successCount > 0) {
    snackbarStore.open(`נטענו בהצלחה ${successCount} דוחות קופה`, 'success')
  }
  if (errorCount > 0) {
    const uniqueErrors = [...new Set(errors)]
    const errorMessage = `נכשלה טעינת ${errorCount} דוחות קופה: ${uniqueErrors.join(', ')}`
    snackbarStore.open(errorMessage, 'error')
  }

  uploadedFiles.value = []
}
</script>

<style scoped>
.location-toggle {
  height: 48px;
}

.files-selected-bg {
  background: rgba(var(--v-theme-surface-variant), 0.4);
}
</style>
