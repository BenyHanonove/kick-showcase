// Import vue APIs
import { ref, type Ref, isRef } from 'vue'

// Import axios error type
import { AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'

// Import utilities
import { extractErrorMessage } from '@shared/utils/extractErrorMessage.util'
import { buildPayload } from '@shared/utils/buildPayload.util'

// Import types
import type { IFormField, FormValue } from '@shared/types/IForm.types'

// Import stores
import { SnackbarStore } from '@stores'

// Import providers
import type { IProviderResult } from '@shared/providers/base.provider'

// Import types
import type { ICrudProvider, ICrudStore } from '@shared/types/ICrud.types'

// Helper to compare values including arrays
function isEqual<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, i) => val === b[i])
  }
  return false
}

// Export generic CRUD composable
export function useCrud<TEntity extends { id: string }, TCreate, TUpdate>(
  provider: ICrudProvider<TEntity, TCreate, TUpdate>,
  store: ICrudStore<TEntity>,
  getCurrentItems?: () => TEntity[],
  createFields?: IFormField[] | Ref<IFormField[]> | (() => IFormField[]),
  updateFields?: IFormField[] | Ref<IFormField[]> | (() => IFormField[]),
) {
  interface DynamicStoreShape {
    [key: string]: TEntity[] | { value: TEntity[] } | undefined
  }

  const snackbarStore = SnackbarStore()

  // Manage creation state variables
  const createDialogOpen = ref(false)
  const isCreating = ref(false)

  // Handle entity creation logic
  const handleCreate = async (formData: TCreate) => {
    isCreating.value = true
    try {
      const activeFields = createFields
        ? isRef(createFields)
          ? createFields.value
          : typeof createFields === 'function'
            ? (createFields as () => IFormField[])()
            : createFields
        : []
      const payload = activeFields.length > 0
        ? (buildPayload(activeFields, formData as object as Record<string, FormValue>) as object as TCreate)
        : formData
      const result = await provider.create(payload)
      if (result.success && result.data) {
        store.add(result.data)
        snackbarStore.open(result.message, 'success')
        createDialogOpen.value = false
        // Clear stale snapshot so a chained handleUpdate diffs the new entity
        _originalItem.value = null
        return result.data
      } else {
        snackbarStore.open(result.message, 'error')
      }
    } catch (error) {
      const message = extractErrorMessage(error as Error | AxiosError)
      snackbarStore.open(message, 'error')
    } finally {
      isCreating.value = false
    }
    return null
  }

  // Manage selection and update states
  const selectedItem = ref<TEntity | null>(null) as Ref<TEntity | null>
  // Immutable snapshot of the item when the dialog opened
  const _originalItem = ref<TEntity | null>(null) as Ref<TEntity | null>

  const updateDialogOpen = ref(false)
  const isUpdating = ref(false)

  // Open update dialog for an item
  const openUpdate = (item: TEntity) => {
    const clone = JSON.parse(JSON.stringify(item))
    selectedItem.value = clone // form can bind v-model to this
    _originalItem.value = JSON.parse(JSON.stringify(item)) // frozen original for diff
    updateDialogOpen.value = true
  }

  // Handle entity update logic
  const handleUpdate = async (formData: TUpdate) => {
    if (!selectedItem.value) return
    const id = selectedItem.value.id

    isUpdating.value = true
    try {
      const targetFields = updateFields || createFields
      const activeFields = targetFields
        ? isRef(targetFields)
          ? targetFields.value
          : typeof targetFields === 'function'
            ? (targetFields as () => IFormField[])()
            : targetFields
        : []
      const cleanFormData = activeFields.length > 0
        ? (buildPayload(activeFields, formData as object as Record<string, FormValue>) as object as TUpdate)
        : formData

      // Get fresh item timestamp
      let freshItem = selectedItem.value
      if (getCurrentItems) {
        const items = getCurrentItems()
        const found = items.find((item) => item.id === id)
        if (found) freshItem = found
      } else {
        const storeObj = store as unknown as DynamicStoreShape
        let items: TEntity[] | null = null

        if (storeObj.data) {
          const dataProp = storeObj.data

          if (Array.isArray(dataProp)) {
            items = dataProp
          } else if (dataProp && 'value' in dataProp && Array.isArray(dataProp.value)) {
            items = dataProp.value
          }
        } else {
          for (const key in storeObj) {
            const val = storeObj[key]
            if (val) {
              if (Array.isArray(val)) {
                items = val
                break
              } else if (Array.isArray(val)) {
                items = val
                break
              }
            }
          }
        }
        if (items) {
          const found = items.find((item) => item && item.id === id)
          if (found) freshItem = found
        }
      }
      const timestamp = (freshItem as TEntity & { timestamp: string }).timestamp

      // Diff cleanFormData against original snapshot
      const diff: Partial<TUpdate> = {}
      const originalItem = (_originalItem.value || selectedItem.value) as object as TUpdate
      for (const k in cleanFormData) {
        if (Object.prototype.hasOwnProperty.call(cleanFormData, k)) {
          const key = k as keyof TUpdate
          if (key === 'id' || key === 'timestamp') continue

          const originalVal = originalItem[key]
          const newVal = cleanFormData[key]
          if (!isEqual(newVal, originalVal)) {
            diff[key] = newVal
          }
        }
      }

      // If there are no changes, exit without hitting the API
      if (Object.keys(diff).length === 0) {
        snackbarStore.open('לא בוצעו שינויים', 'info')
        updateDialogOpen.value = false
        selectedItem.value = null
        return
      }

      // Build payload with timestamp
      const payload: TUpdate = {
        ...diff,
        id,
        timestamp,
      } as object as TUpdate

      const result = await provider.update(id, payload)

      if (result.success && result.data) {
        store.update(result.data)
        selectedItem.value = result.data
        snackbarStore.open(result.message, 'success')
        updateDialogOpen.value = false
        selectedItem.value = null
      } else {
        if (result.statusCode === StatusCodes.CONFLICT) {
          const getResult = await provider.get(id)
          if (getResult.success && getResult.data) {
            store.update(getResult.data)
            snackbarStore.open(
              'הנתונים עודכנו על ידי משתמש אחר. הנתונים המעודכנים ביותר נטענו מחדש.',
              'warning',
            )
            updateDialogOpen.value = false
            selectedItem.value = null
            return
          }
        }
        snackbarStore.open(result.message, 'error')
      }
    } catch (error) {
      const message = extractErrorMessage(error as Error | AxiosError)
      const isConflict = error instanceof AxiosError && error.response?.status === StatusCodes.CONFLICT

      if (isConflict) {
        const getResult = await provider.get(id)
        if (getResult.success && getResult.data) {
          store.update(getResult.data)
          snackbarStore.open(
            'הנתונים עודכנו על ידי משתמש אחר. הנתונים המעודכנים ביותר נטענו מחדש.',
            'warning',
          )
          updateDialogOpen.value = false
          selectedItem.value = null
          return
        }
      }
      snackbarStore.open(message, 'error')
    } finally {
      isUpdating.value = false
    }
  }

  // Manage deletion dialog states
  const deleteDialogOpen = ref(false)
  const isDeleting = ref(false)

  // Open delete confirmation dialog
  const openDelete = (item: TEntity) => {
    selectedItem.value = item
    deleteDialogOpen.value = true
  }

  // Handle entity deletion logic
  const handleDelete = async () => {
    if (!selectedItem.value) return
    isDeleting.value = true
    try {
      const result = await provider.delete(selectedItem.value.id)
      if (result.success && result.data) {
        store.remove(selectedItem.value.id)
        snackbarStore.open(result.message, 'success')
        deleteDialogOpen.value = false
        selectedItem.value = null
      } else {
        snackbarStore.open(result.message, 'error')
      }
    } catch (error) {
      const message = extractErrorMessage(error as Error | AxiosError)
      snackbarStore.open(message, 'error')
    } finally {
      isDeleting.value = false
    }
  }

  return {
    createDialogOpen,
    isCreating,
    handleCreate,

    updateDialogOpen,
    isUpdating,
    openUpdate,
    handleUpdate,

    deleteDialogOpen,
    isDeleting,
    openDelete,
    handleDelete,

    selectedItem,
  }
}

// Export bulk update composable
export function useBulkUpdate<TEntity extends { id: string }, TUpdate = Partial<TEntity>>(
  provider: {
    update: (
      id: string,
      data: TUpdate,
    ) => Promise<{ success: boolean; data?: TEntity | null; message: string }>
  },
  store: { update: (item: TEntity) => void },
  getCurrentItems: () => TEntity[],
) {
  const snackbarStore = SnackbarStore()
  const isBulkUpdating = ref(false)

  // Snapshot of original items, taken before user edits, keyed by id
  const snapshot = ref<Record<string, TEntity>>({})

  // Take a snapshot of the current items
  const takeSnapshot = () => {
    const map: Record<string, TEntity> = {}
    for (const item of getCurrentItems()) {
      map[item.id] = { ...item }
    }
    snapshot.value = map
  }

  // Handle bulk updates on list of items
  const handleBulkUpdate = async <K extends keyof TEntity>(items: TEntity[], field: K) => {
    // Take a first snapshot if none exists yet
    if (Object.keys(snapshot.value).length === 0) {
      takeSnapshot()
    }

    const changes = items.filter((item) => {
      const originalItem = snapshot.value[item.id]
      return originalItem !== undefined && originalItem[field] !== item[field]
    })

    if (changes.length === 0) {
      snackbarStore.open('לא בוצעו שינויים', 'info')
      return 'noop'
    }

    isBulkUpdating.value = true
    const currentItems = getCurrentItems()
    const results = await Promise.all(
      changes.map((item) => {
        // Get fresh item to ensure latest timestamp
        const freshItem = currentItems.find((i) => i.id === item.id) || item
        const timestamp = (freshItem as TEntity & { timestamp: string }).timestamp
        const payload = {
          [field]: item[field],
          timestamp,
        }
        return provider.update(item.id, payload as TUpdate)
      }),
    )

    let lastMessage = ''
    let failures = 0
    for (const r of results) {
      if (r.success && r.data) {
        store.update(r.data)
        lastMessage = r.message
      } else {
        failures++
        lastMessage = r.message
      }
    }
    isBulkUpdating.value = false

    // Refresh snapshot so next call detects only new changes
    takeSnapshot()

    snackbarStore.open(lastMessage, failures === 0 ? 'success' : 'error')
    return failures === 0 ? 'success' : 'error'
  }

  return {
    isBulkUpdating,
    handleBulkUpdate,
    takeSnapshot,
  }
}

// Export summary downloader composable
export function useSummaryDownloader<TArgs extends (string | undefined)[]>(
  providerSummaryMethod: (
    sessionId: string,
    ...args: TArgs
  ) => Promise<{ blob: Blob; fileName: string }>,
) {
  const snackbarStore = SnackbarStore()
  const isSummarizing = ref(false)

  // Download session summary PDF
  const handleSummary = async (sessionId: string, ...args: TArgs) => {
    if (!sessionId) {
      snackbarStore.open('חסר מזהה סשן', 'error')
      return
    }
    isSummarizing.value = true
    try {
      const { blob, fileName } = await providerSummaryMethod(sessionId, ...args)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      snackbarStore.open('סיכום הורד בהצלחה', 'success')
    } catch {
      snackbarStore.open('שגיאה בהורדת סיכום', 'error')
    } finally {
      isSummarizing.value = false
    }
  }

  return {
    isSummarizing,
    handleSummary,
  }
}

// Export generic receipt handler composable
export function useReceipt<
  TEntity extends { id: string; sessionId: string; receiptUrl?: string },
  TPresignData = {
    file: string
    sessionId: string
    id: string
    filename?: string
  },
>(
  provider: {
    presign: (data: TPresignData) => Promise<IProviderResult<TEntity>>
    unsign: (id: string) => Promise<IProviderResult<TEntity>>
  },
  store: { update: (item: TEntity) => void },
  mapPresignData?: (item: TEntity, payload: { file: File; base64: string }) => TPresignData,
) {
  const snackbarStore = SnackbarStore()
  const receiptDialogOpen = ref(false)
  const isProcessingReceipt = ref(false)
  const receiptItem = ref<TEntity | null>(null) as Ref<TEntity | null>

  const openReceipt = (item: TEntity) => {
    receiptItem.value = item
    receiptDialogOpen.value = true
  }

  const handleReceiptUpload = async (payload: { file: File; base64: string }) => {
    if (!receiptItem.value) return
    isProcessingReceipt.value = true
    try {
      const data = mapPresignData
        ? mapPresignData(receiptItem.value, payload)
        : ({
            id: receiptItem.value.id,
            sessionId: receiptItem.value.sessionId,
            file: payload.base64,
            filename: payload.file.name,
          } as TPresignData)

      const result = await provider.presign(data)

      if (result.success && result.data) {
        store.update(result.data)
        receiptItem.value = result.data
        snackbarStore.open('הקבלה הועלתה בהצלחה', 'success')
      } else {
        snackbarStore.open(result.message || 'שגיאה בהעלאת הקבלה', 'error')
      }
    } catch (err) {
      let message = 'שגיאה בלתי צפויה'
      if (err instanceof Error) {
        message = err.message
      }
      snackbarStore.open(message, 'error')
    } finally {
      isProcessingReceipt.value = false
    }
  }

  const handleReceiptRemove = async () => {
    if (!receiptItem.value) return
    isProcessingReceipt.value = true
    try {
      const result = await provider.unsign(receiptItem.value.id)

      if (result.success && result.data) {
        store.update(result.data)
        receiptItem.value = result.data
        snackbarStore.open('הקבלה הוסרה בהצלחה', 'success')
      } else {
        snackbarStore.open(result.message || 'שגיאה בהסרת הקבלה', 'error')
      }
    } catch (err) {
      let message = 'שגיאה בלתי צפויה'
      if (err instanceof Error) {
        message = err.message
      }
      snackbarStore.open(message, 'error')
    } finally {
      isProcessingReceipt.value = false
    }
  }

  return {
    receiptDialogOpen,
    isProcessingReceipt,
    receiptItem,
    openReceipt,
    handleReceiptUpload,
    handleReceiptRemove,
  }
}
