import { computed } from 'vue'

import { rules } from '@shared/utils/rules.util'

import { AuthStore, EmployeesStore, SnackbarStore } from '@stores'

import { useCrud, useBulkUpdate, useSummaryDownloader } from '@shared/composables/crud.composable'

import { shiftProvider } from '@shift/providers/shift.provider'
import { employeeProvider } from '@employee/providers/employee.provider'

import type { ICrudStore } from '@shared/types/ICrud.types'
import type { IShift, ICreateShift, IUpdateShift } from '@shift/types/IShift.types'
import { ShiftRole, ShiftRoleLabels } from '@shift/types/ShiftRole.types'
import { ShiftRegistration } from '@shift/types/ShiftRegistration.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export shift crud composable
export function useShiftCrud(store: ICrudStore<IShift>) {
  const authStore = AuthStore()

  const base = useCrud<IShift, ICreateShift, IUpdateShift>(
    shiftProvider,
    store,
    undefined,
    () => shiftFields.value,
    () => shiftUpdateFields.value,
  )

  // Initialize summary download actions
  const { isSummarizing, handleSummary } = useSummaryDownloader(
    employeeProvider.summary.bind(employeeProvider),
  )

  // GenericForm configurations ------------------------------------------------
  const shiftInitialState: ICreateShift = {
    sessionId: '',
    employeeId: '',
    role: ShiftRole.BARTENDER,
    timing: '',
    bonusTravel: 0,
    bonusManage: 0,
    bonusSetup: 0,
    bonusOther: 0,
  }

  const shiftFields = computed<IFormField[]>(() => {
    const fields: IFormField[] = [
      {
        key: 'employeeId',
        label: 'עובד*',
        type: 'select', // Slotted custom in ShiftManager #employeeId
        rules: [rules.required('חובה לבחור עובד')],
      },
      {
        key: 'role',
        label: 'מחלקה*',
        type: 'select',
        items: Object.values(ShiftRole).map((role) => ({
          title: ShiftRoleLabels[role],
          value: role,
        })),
        rules: [rules.required('חובה לבחור מחלקה')],
      },
      {
        key: 'timing',
        label: 'זמן המשמרת',
        type: 'timing',
      },
    ]

    if (authStore.isAdmin) {
      // Anchor field; bonus inputs render via #bonusTravel slot
      fields.push({
        key: 'bonusTravel',
        label: 'תוספות',
        type: 'number',
        cols: 12,
      })
    }

    return fields
  })

  const shiftUpdateFields = computed<IFormField[]>(() => {
    const fields: IFormField[] = [
      {
        key: 'employeeName',
        label: 'עובד',
        type: 'text',
        props: { readonly: true, disabled: true },
      },
      {
        key: 'role',
        label: 'תפקיד*',
        type: 'select',
        items: Object.values(ShiftRole).map((role) => ({
          title: ShiftRoleLabels[role],
          value: role,
        })),
        rules: [rules.required('חובה לבחור תפקיד')],
      },
      {
        key: 'timing',
        label: 'זמן המשמרת',
        type: 'timing',
      },
      {
        key: 'notes',
        label: 'הערות',
        type: 'textarea',
        props: { rows: 2, autoGrow: true },
      },
    ]

    if (authStore.isAdmin) {
      // Anchor field; bonus inputs render via #bonusTravel slot
      fields.push({
        key: 'bonusTravel',
        label: 'תוספות',
        type: 'number',
        cols: 12,
      })
    }

    return fields
  })

  const shiftUpdateInitial = computed(() => {
    const shift = base.selectedItem.value
    if (!shift) return shiftInitialState
    const emp = EmployeesStore().get(shift.employeeId)
    return {
      ...shift,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'עובד לא ידוע',
      notes: shift.notes || '',
      bonusTravel: shift.bonusTravel || 0,
      bonusManage: shift.bonusManage || 0,
      bonusSetup: shift.bonusSetup || 0,
      bonusOther: shift.bonusOther || 0,
    }
  })

  const toggleApproved = async (shift: IShift) => {
    const nextApproved = !shift.approved
    const payload: IUpdateShift = {
      id: shift.id,
      timestamp: shift.timestamp,
      approved: nextApproved,
    }
    const result = await shiftProvider.update(shift.id, payload)
    if (result.success && result.data) {
      store.update(result.data)
      SnackbarStore().open(
        nextApproved ? 'המשמרת אושרה בהצלחה' : 'אישור המשמרת בוטל בהצלחה',
        'success',
      )
      return result.data
    } else {
      SnackbarStore().open(result.message || 'שגיאה בעדכון אישור משמרת', 'error')
      return null
    }
  }

  // Approve or reject a registration; touches the registration status only
  const setRegistration = async (shift: IShift, registration: ShiftRegistration) => {
    const payload: IUpdateShift = {
      id: shift.id,
      timestamp: shift.timestamp,
      registration,
    }
    const result = await shiftProvider.update(shift.id, payload)
    if (result.success && result.data) {
      store.update(result.data)
      SnackbarStore().open(
        registration === ShiftRegistration.APPROVED ? 'ההרשמה אושרה' : 'ההרשמה נדחתה',
        'success',
      )
      return result.data
    } else {
      SnackbarStore().open(result.message || 'שגיאה בעדכון ההרשמה', 'error')
      return null
    }
  }

  const toggleReceived = async (shift: IShift) => {
    const nextReceived = !shift.received
    const payload: IUpdateShift = {
      id: shift.id,
      timestamp: shift.timestamp,
      received: nextReceived,
    }
    const result = await shiftProvider.update(shift.id, payload)
    if (result.success && result.data) {
      store.update(result.data)
      SnackbarStore().open(
        nextReceived ? 'המעטפה סומנה כהתקבלה' : 'סימון קבלת המעטפה בוטל',
        'success',
      )
      return result.data
    } else {
      SnackbarStore().open(result.message || 'שגיאה בעדכון קבלת מעטפה', 'error')
      return null
    }
  }

  // Bulk hourly update; getCurrentItems supplies fresh timestamps from the view
  const { isBulkUpdating: isBulkHourlyUpdating, handleBulkUpdate: handleBulkHourlyUpdate, takeSnapshot: takeHourlySnapshot } =
    useBulkUpdate<IShift, IUpdateShift>(
      shiftProvider,
      store,
      () => (store as ICrudStore<IShift> & { data?: IShift[] | null }).data || [],
    )

  return {
    ...base,
    toggleApproved,
    setRegistration,
    toggleReceived,
    isBulkHourlyUpdating,
    handleBulkHourlyUpdate,
    takeHourlySnapshot,
    isSummarizing,
    handleSummary,
    shiftInitialState,
    shiftFields,
    shiftUpdateFields,
    shiftUpdateInitial,
  }
}
