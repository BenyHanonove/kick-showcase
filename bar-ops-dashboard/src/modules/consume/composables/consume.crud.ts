import { ref } from 'vue'
import { useRoute } from 'vue-router'

// Import axios error type
import { AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'

// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import utilities
import { extractErrorMessage } from '@shared/utils/extractErrorMessage.util'

// Import stores
import { SnackbarStore, SessionStore, SaleStore } from '@stores'

// Import composables
import { useCrud, useBulkUpdate } from '@shared/composables/crud.composable'

// Import providers
import { consumeProvider } from '@consume/providers/consume.provider'

// Import types
import type {
  ConsumeQuantityField,
  IConsume,
  ICreateConsume,
  IUpdateConsume,
} from '@consume/types/IConsume.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export consume crud composable
export function useConsumeCrud() {
  const route = useRoute()
  const isSaleContext = route?.path?.startsWith('/sales')

  const snackbarStore = SnackbarStore()
  const sessionStore = SessionStore()
  const saleStore = SaleStore()

  const currentStore = isSaleContext ? saleStore : sessionStore

  // Initialize base CRUD actions
  const base = useCrud<IConsume, ICreateConsume, IUpdateConsume>(
    consumeProvider,
    currentStore.consumes,
  )

  // Manage bulk creation states
  const isBulkCreating = ref(false)

  // Initialize bulk update actions
  const { isBulkUpdating, handleBulkUpdate } = useBulkUpdate<IConsume, IUpdateConsume>(
    consumeProvider,
    currentStore.consumes,
    () => currentStore.consumes?.data || [],
  )

  // Create multiple consume records; optional secondaryField adds a second quantity
  const handleBulkCreate = async (
    items: IConsume[],
    sessionId: string,
    targetField:
      | 'target'
      | 'order'
      | 'arrived'
      | 'fromStorage'
      | 'creditedToSupplier'
      | 'returnedToStorage' = 'order',
    secondaryField?:
      | 'target'
      | 'order'
      | 'arrived'
      | 'fromStorage'
      | 'creditedToSupplier'
      | 'returnedToStorage',
  ) => {
    const activeFields = secondaryField ? [targetField, secondaryField] : [targetField]
    const targets = items.filter((item) => activeFields.some((field) => (item[field] ?? 0) > 0))
    if (targets.length === 0) {
      snackbarStore.open('נא להזין כמות לפחות למוצר אחד', 'warning')
      return false
    }

    isBulkCreating.value = true
    const results = await Promise.all(
      targets.map((item) =>
        consumeProvider.create({
          sessionId,
          productId: item.productId,
          chargedPrice: item.chargedPrice || 0,
          supplierPrice: item.supplierPrice || 0,
          target: activeFields.includes('target') ? (item.target ?? 0) : 0,
          order: activeFields.includes('order') ? (item.order ?? 0) : 0,
          arrived: activeFields.includes('arrived') ? (item.arrived ?? 0) : 0,
          fromStorage: activeFields.includes('fromStorage') ? (item.fromStorage ?? 0) : 0,
          creditedToSupplier: activeFields.includes('creditedToSupplier')
            ? (item.creditedToSupplier ?? 0)
            : 0,
          returnedToStorage: activeFields.includes('returnedToStorage')
            ? (item.returnedToStorage ?? 0)
            : 0,
        }),
      ),
    )

    let lastMessage = ''
    let failures = 0
    for (const r of results) {
      if (r.success && r.data) {
        currentStore.consumes.add(r.data)
        lastMessage = r.message
      } else {
        failures++
        lastMessage = r.message
      }
    }
    isBulkCreating.value = false

    snackbarStore.open(lastMessage, failures === 0 ? 'success' : 'error')
    return failures === 0
  }

  // Manage inline (single-field) quantity edits made straight from a consume row
  const isQuickUpdating = ref(false)

  // Update one quantity field without opening the edit dialog.
  // Stays silent on success — the cube shows the new number — and only speaks up on failure.
  const handleQuickUpdate = async (
    item: IConsume,
    field: ConsumeQuantityField,
    value: number,
  ): Promise<boolean> => {
    if (!Number.isFinite(value) || value < 0) {
      snackbarStore.open('כמות לא תקינה', 'warning')
      return false
    }
    if ((item[field] ?? 0) === value) return false

    // Read the freshest timestamp from the store so concurrent edits are detected
    const fresh = (currentStore.consumes?.data || []).find((c) => c.id === item.id) || item

    isQuickUpdating.value = true
    try {
      const result = await consumeProvider.update(item.id, {
        id: item.id,
        timestamp: fresh.timestamp,
        [field]: value,
      } as IUpdateConsume)

      if (result.success && result.data) {
        currentStore.consumes.update(result.data)
        return true
      }

      // Another user changed this record — reload it rather than clobbering their edit
      if (result.statusCode === StatusCodes.CONFLICT) {
        const getResult = await consumeProvider.get(item.id)
        if (getResult.success && getResult.data) {
          currentStore.consumes.update(getResult.data)
          snackbarStore.open(
            'הנתונים עודכנו על ידי משתמש אחר. הנתונים המעודכנים ביותר נטענו מחדש.',
            'warning',
          )
          return false
        }
      }

      snackbarStore.open(result.message, 'error')
    } catch (error) {
      snackbarStore.open(extractErrorMessage(error as Error | AxiosError), 'error')
    } finally {
      isQuickUpdating.value = false
    }
    return false
  }

  // Initial state for the create form
  const consumeInitialState = (sessionId: string): ICreateConsume => ({
    sessionId,
    productId: '',
    chargedPrice: 0,
    supplierPrice: 0,
    target: 0,
    order: 0,
    arrived: 0,
    fromStorage: 0,
    creditedToSupplier: 0,
    returnedToStorage: 0,
  })

  // Build create form fields; productId rendered via view's per-field slot
  const getCreateFields = (showPricesAndOrder: boolean, isAdmin: boolean): IFormField[] => [
    {
      key: 'productId',
      label: 'מוצר*',
      type: 'select',
      rules: [rules.required()],
    },
    {
      key: 'chargedPrice',
      label: 'מחיר לחיוב*',
      type: 'number',
      cols: 6,
      props: { prefix: '₪' },
      hidden: !showPricesAndOrder || !isAdmin,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'target',
      label: 'כמות יעד*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'order',
      label: 'כמות הזמנה*',
      type: 'number',
      cols: 6,
      hidden: !showPricesAndOrder,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'arrived',
      label: 'כמות שהגיעה*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'fromStorage',
      label: 'כמות מהמחסן*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'creditedToSupplier',
      label: 'הוחזר לספק*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'returnedToStorage',
      label: 'הוחזר למחסן*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
  ]

  // Build update form fields; priceSummary rendered via view's per-field slot
  const getUpdateFields = (showPricesAndOrder: boolean, isAdmin: boolean): IFormField[] => [
    {
      key: 'chargedPrice',
      label: 'מחיר לחיוב*',
      type: 'number',
      cols: 6,
      props: { prefix: '₪' },
      hidden: !showPricesAndOrder || !isAdmin,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'supplierPrice',
      label: 'מחיר ספק*',
      type: 'number',
      cols: 6,
      props: { prefix: '₪' },
      hidden: !showPricesAndOrder || !isAdmin,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'target',
      label: 'כמות יעד*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'order',
      label: 'כמות הזמנה*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'arrived',
      label: 'כמות שהגיעה*',
      type: 'number',
      cols: 6,
      hidden: !showPricesAndOrder,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'fromStorage',
      label: 'כמות מהמחסן*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'creditedToSupplier',
      label: 'הוחזר לספק*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'returnedToStorage',
      label: 'הוחזר למחסן*',
      type: 'number',
      cols: 6,
      rules: [rules.minNumber(0)],
    },
    {
      key: 'priceSummary',
      label: '',
      type: 'select',
      cols: 12,
      hidden: !showPricesAndOrder || !isAdmin,
    },
  ]

  return {
    ...base,
    isBulkCreating,
    isBulkUpdating,
    isQuickUpdating,
    handleBulkCreate,
    handleBulkUpdate,
    handleQuickUpdate,
    consumeInitialState,
    getCreateFields,
    getUpdateFields,
  }
}
