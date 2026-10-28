import { ref, onMounted, watch } from 'vue'

import { SnackbarStore } from '@stores'

import { intervalProvider } from '@interval/providers/interval.provider'

import { useCrud } from '@shared/composables/crud.composable'

import { rules } from '@shared/utils/rules.util'

import type { IInterval, ICreateInterval, IUpdateInterval } from '@interval/types/IInterval.types'
import type { IFormField } from '@shared/types/IForm.types'

// Local shape of the interval form (shiftId / sessionId are injected on submit)
type IntervalFormData = { start: string; end: string }

// Export interval crud composable
export function useIntervalCrud(shiftId: string, sessionId: string) {
  const snackbarStore = SnackbarStore()

  // Local state declarations
  const intervals = ref<IInterval[]>([])
  const loading = ref(false)
  const editingId = ref<string | null>(null)
  const isAdding = ref(false)

  // Define local operations for store sync
  const localStore = {
    add: (item: IInterval) => {
      intervals.value.push(item)
    },
    update: (item: IInterval) => {
      const idx = intervals.value.findIndex((i) => i.id === item.id)
      if (idx !== -1) intervals.value[idx] = item
      editingId.value = null
    },
    remove: (id: string) => {
      intervals.value = intervals.value.filter((i) => i.id !== id)
    },
  }

  const base = useCrud<IInterval, ICreateInterval, IUpdateInterval>(intervalProvider, localStore)

  // Set up snapshots when edit mode is activated
  watch(editingId, (newId) => {
    if (newId) {
      const item = intervals.value.find((i) => i.id === newId)
      if (item) base.openUpdate(item)
    }
  })

  // GenericForm configuration ------------------------------------------------
  // Fresh create form defaults start time to "now"
  const intervalInitialState = (): IntervalFormData => ({
    start: new Date().toISOString().slice(0, 16),
    end: '',
  })

  // Field-builder gets live form so "end" rule cross-checks "start"
  const getIntervalFields = (form: Partial<IntervalFormData>): IFormField[] => [
    {
      key: 'start',
      label: 'שעת התחלה:',
      type: 'timing',
      rules: [rules.required()],
    },
    {
      key: 'end',
      label: 'שעת סיום:',
      type: 'timing',
      rules: [
        (v) => !v || !form.start || (v as string) > form.start || 'סיום חייב להיות אחרי התחלה',
      ],
    },
  ]

  // Fetch interval list from provider
  const fetch = async () => {
    loading.value = true
    const result = await intervalProvider.list({ shiftId })
    if (result.success && result.data) {
      intervals.value = result.data
    } else {
      snackbarStore.open(result.message, 'error')
    }
    loading.value = false
  }

  // Handle interval creation
  const onCreate = async (payload: Omit<ICreateInterval, 'shiftId' | 'sessionId'>) => {
    await base.handleCreate({ ...payload, shiftId, sessionId } as ICreateInterval)
    isAdding.value = false
  }

  // Handle interval update
  const onUpdate = async (formData: Partial<IntervalFormData>) => {
    // Restore snapshots if cleared (e.g., from previous "no changes" attempt)
    if (!base.selectedItem.value && editingId.value) {
      const item = intervals.value.find((i) => i.id === editingId.value)
      if (item) base.openUpdate(item)
    }

    if (!base.selectedItem.value) return
    const payload: IUpdateInterval = {
      ...formData,
      id: base.selectedItem.value.id,
      timestamp: base.selectedItem.value.timestamp,
    } as IUpdateInterval
    await base.handleUpdate(payload)
  }

  // Handle interval deletion
  const onDelete = async (id: string) => {
    const target = intervals.value.find((i) => i.id === id)
    if (!target) return
    base.openDelete(target)
    await base.handleDelete()
  }

  onMounted(fetch)

  return {
    intervals,
    loading,
    editingId,
    isAdding,
    isCreating: base.isCreating,
    isUpdating: base.isUpdating,
    isDeleting: base.isDeleting,
    selectedItem: base.selectedItem,
    onCreate,
    onUpdate,
    onDelete,
    fetch,
    intervalInitialState,
    getIntervalFields,
  }
}
