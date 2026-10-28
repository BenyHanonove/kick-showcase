import { ref, computed } from 'vue'

import { AxiosError } from 'axios'

import { extractErrorMessage } from '@shared/utils/extractErrorMessage.util'

import { rules } from '@shared/utils/rules.util'

import { SnackbarStore, ClientsStore } from '@stores'

import { useCrud, useSummaryDownloader } from '@shared/composables/crud.composable'

import { sessionProvider } from '@session/providers/session.provider'

import type { ICrudStore } from '@shared/types/ICrud.types'
import type { ISession, ICreateSession, IUpdateSession } from '@session/types/ISession.types'
import type { ISessionFilters } from '@session/types/ISessionRepository.types'
import { SessionStatus, sessionStatusOptions } from '@session/types/status.types'
import { SessionType, SessionTypeLabels } from '@session/types/SessionType.types'
import type { IFormField } from '@shared/types/IForm.types'

// Define store interface for session CRUD actions
interface ISessionCrudStore extends ICrudStore<ISession> {
  set(items: ISession[]): void
  setLoading(loading: boolean): void
  sessions?: import('vue').Ref<ISession[] | null> | ISession[] | null
}

// Export session crud composable
export function useSessionCrud(store: ISessionCrudStore) {
  const snackbarStore = SnackbarStore()

  const clientsStore = ClientsStore()

  const base = useCrud<ISession, ICreateSession, IUpdateSession>(sessionProvider, store)

  // Initialize summary download actions
  const { isSummarizing, handleSummary: downloadSummary } = useSummaryDownloader(
    sessionProvider.summary.bind(sessionProvider),
  )

  // GenericForm configurations ------------------------------------------------
  const sessionInitialState: ICreateSession = {
    clientId: '',
    datetime: new Date().toISOString().split('T')[0] || '',
    name: '',
    peopleAmount: 0,
    location: '',
    processingFee: 2,
    type: SessionType.NATURE_PARTY,
  }

  const sessionFields = computed<IFormField[]>(() => [
    {
      key: 'name',
      label: 'שם האירוע*',
      type: 'text',
      rules: [rules.required('חובה להזין שם אירוע')],
    },
    {
      key: 'clientId',
      label: 'בחר לקוח*',
      type: 'select',
      items: (clientsStore.clients || []).map((c) => ({ title: c.brand, value: c.id })),
      props: { loading: clientsStore.loading },
      rules: [rules.required('חובה לבחור לקוח')],
    },
    {
      key: 'type',
      label: 'סוג אירוע*',
      type: 'select',
      items: Object.entries(SessionTypeLabels).map(([value, title]) => ({ title, value })),
      rules: [rules.required('חובה לבחור סוג אירוע')],
    },
    {
      key: 'datetime',
      label: 'תאריך*',
      type: 'date',
      rules: [rules.required('חובה להזין תאריך')],
    },
    {
      key: 'peopleAmount',
      label: 'כמות אנשים*',
      type: 'number',
      props: { prependInnerIcon: 'mdi-account-group' },
      rules: [
        rules.required('חובה להזין כמות אנשים'),
        rules.greaterThan(0, 'כמות האנשים חייבת להיות גדולה מ-0'),
      ],
    },
    {
      key: 'location',
      label: 'מיקום*',
      type: 'text',
      props: { prependInnerIcon: 'mdi-map-marker' },
      rules: [rules.required('חובה להזין מיקום')],
    },
  ])

  const sessionUpdateFields = computed<IFormField[]>(() => [
    {
      key: 'name',
      label: 'שם הפגישה*',
      type: 'text',
      rules: [rules.required('שדה שם הוא חובה')],
    },
    {
      key: 'clientId',
      label: 'בחר לקוח*',
      type: 'select',
      items: (clientsStore.clients || []).map((c) => ({ title: c.brand || c.name, value: c.id })),
      props: { loading: clientsStore.loading },
      rules: [rules.required('חובה לבחור לקוח')],
    },
    {
      key: 'peopleAmount',
      label: 'כמות אנשים',
      type: 'number',
      rules: [rules.greaterThan(0, 'כמות האנשים חייבת להיות גדולה מ-0')],
    },
    {
      key: 'location',
      label: 'מיקום',
      type: 'text',
    },
    {
      key: 'processingFee',
      label: 'עמלת סליקה',
      type: 'number',
      props: { prependInnerIcon: 'mdi-percent' },
      rules: [rules.minNumber(0, 'עמלת הסליקה חייבת להיות 0 או יותר')],
    },
    {
      key: 'split',
      label: 'אחוז חלוקה',
      type: 'number',
      props: { prependInnerIcon: 'mdi-percent' },
      rules: [rules.between(1, 100, 'אחוז החלוקה חייב להיות בין 1 ל-100')],
    },
    {
      key: 'status',
      label: 'סטטוס',
      type: 'select',
      items: sessionStatusOptions.filter((opt) => opt.value !== SessionStatus.CLOSE),
    },
    {
      key: 'notes',
      label: 'הערות',
      type: 'textarea',
    },
  ])

  const sessionUpdateInitial = computed<IUpdateSession>(() => {
    const session = base.selectedItem.value
    if (!session) {
      return {
        id: '',
        timestamp: '',
        clientId: '',
        datetime: '',
        name: '',
        peopleAmount: 0,
        location: '',
        processingFee: 2,
        type: SessionType.NATURE_PARTY,
        split: undefined,
        notes: undefined,
      }
    }
    return {
      id: session.id,
      timestamp: session.timestamp,
      clientId: session.clientId,
      name: session.name,
      peopleAmount: session.peopleAmount,
      location: session.location,
      processingFee: session.processingFee,
      type: session.type,
      status: session.status,
      datetime: session.datetime ? session.datetime.split('T')[0] || '' : '',
      split: session.split,
      notes: session.notes,
    }
  })

  // Guard summary: only allow download when session is closed
  const handleSummary = async (sessionId: string, status?: SessionStatus) => {
    if (status && status !== SessionStatus.CLOSE) {
      snackbarStore.open('לא ניתן להפיק דוח לפגישה שלא נסגרה', 'warning')
      return
    }
    await downloadSummary(sessionId)
  }

  // Fetch session list from provider
  const fetchSessions = async (filters?: ISessionFilters) => {
    store.setLoading(true)
    const result = await sessionProvider.list(filters)
    if (result.success && result.data) {
      store.set(result.data)
    } else {
      snackbarStore.open(result.message, 'error')
    }
    store.setLoading(false)
  }

  // Wrap handleUpdate to sync matching session into SessionStore
  // Staffing Dialog & Actions
  const staffingDialogOpen = ref(false)
  const isStaffingUpdating = ref(false)
  const selectedStaffingItem = ref<ISession | null>(null)

  const openStaffing = (item: ISession) => {
    selectedStaffingItem.value = item
    staffingDialogOpen.value = true
  }

  const handleStaffingUpdate = async (formData: IUpdateSession) => {
    if (!selectedStaffingItem.value) return
    isStaffingUpdating.value = true
    try {
      const payload: IUpdateSession = {
        id: selectedStaffingItem.value.id,
        timestamp: selectedStaffingItem.value.timestamp,
        barmanAmount: formData.barmanAmount,
        waitersAmount: formData.waitersAmount,
        barMangerAmount: formData.barMangerAmount,
        waiterMangerAmount: formData.waiterMangerAmount,
        Runners: formData.Runners,
      }
      const result = await sessionProvider.update(selectedStaffingItem.value.id, payload)
      if (result.success) {
        const merged = {
          ...selectedStaffingItem.value,
          ...formData,
          ...(result.data && (result.data as ISession).id ? (result.data as object) : {}),
          id: selectedStaffingItem.value.id,
        } as ISession
        store.update(merged)
        snackbarStore.open('סד"ק עודכן בהצלחה', 'success')
        staffingDialogOpen.value = false
        selectedStaffingItem.value = null
      } else {
        snackbarStore.open(result.message, 'error')
      }
    } catch (error) {
      const message = extractErrorMessage(error as Error | AxiosError)
      snackbarStore.open(message, 'error')
    } finally {
      isStaffingUpdating.value = false
    }
  }

  return {
    ...base,
    isSummarizing,
    handleSummary,
    fetchSessions,
    staffingDialogOpen,
    isStaffingUpdating,
    selectedStaffingItem,
    openStaffing,
    handleStaffingUpdate,
    sessionInitialState,
    sessionFields,
    sessionUpdateFields,
    sessionUpdateInitial,
  }
}
