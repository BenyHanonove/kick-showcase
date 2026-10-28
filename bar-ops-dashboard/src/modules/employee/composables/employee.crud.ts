// Import vue APIs
import { ref } from 'vue'

// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import stores
import { SnackbarStore, EmployeesStore } from '@stores'

// Import composables
import { useCrud } from '@shared/composables/crud.composable'

// Import providers
import { employeeProvider } from '@employee/providers/employee.provider'

// Import types
import type { IEmployee, ICreateEmployee, IUpdateEmployee } from '@employee/types/IEmployee.types'
import { EmployeeType, EmployeeTypeLabels } from '@employee/types/EmployeeType.types'
import { EmployeeLevel, EmployeeLevelLabels } from '@employee/types/EmployeeLevel.types'
import { EmployeeGender, EmployeeGenderLabels } from '@employee/types/EmployeeGender.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export employee crud composable
export function useEmployeeCrud() {
  const snackbarStore = SnackbarStore()
  const employeesStore = EmployeesStore()

  // Initialize base CRUD actions
  const base = useCrud<IEmployee, ICreateEmployee, IUpdateEmployee>(
    employeeProvider,
    employeesStore,
  )

  // Manage summary state
  const isGeneratingSummary = ref(false)

  // Track which employee currently has a link being sent
  const sendingLinkId = ref<string | null>(null)

  // Employee form configuration
  const employeeFields: IFormField[] = [
    {
      key: 'firstName',
      label: 'שם פרטי*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'lastName',
      label: 'שם משפחה*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'identityNumber',
      label: 'תעודת זהות*',
      type: 'text',
      rules: [rules.required(), rules.israeliId('תז חייבת להכיל 9 ספרות')],
    },
    {
      key: 'phone',
      label: 'מספר טלפון*',
      type: 'text',
      rules: [rules.required(), rules.phone()],
    },
    {
      key: 'type',
      label: 'סוג עובד',
      type: 'select',
      items: Object.entries(EmployeeTypeLabels).map(([value, label]) => ({
        title: label,
        value: value as EmployeeType,
      })),
      props: { clearable: true },
    },
    {
      key: 'level',
      label: 'רמת עובד',
      type: 'select',
      items: Object.entries(EmployeeLevelLabels).map(([value, label]) => ({
        title: label,
        value: value as EmployeeLevel,
      })),
      props: { clearable: true },
    },
    {
      key: 'gender',
      label: 'מגדר',
      type: 'select',
      items: Object.entries(EmployeeGenderLabels).map(([value, label]) => ({
        title: label,
        value: value as EmployeeGender,
      })),
      props: { clearable: true },
    },
    {
      key: 'instagram',
      label: 'אינסטגרם (שם משתמש)',
      type: 'text',
      rules: [],
    },
    {
      key: 'address',
      label: 'כתובת מגורים*',
      type: 'text',
      rules: [rules.required()],
    },
  ]

  const employeeInitialState: ICreateEmployee = {
    firstName: '',
    lastName: '',
    identityNumber: '',
    phone: '',
    type: EmployeeType.WAITER,
    instagram: '',
    address: '',
  }

  // Handle employee summary retrieval
  const handleSummary = async (sessionId: string, sessionName?: string) => {
    isGeneratingSummary.value = true
    try {
      const report = await employeeProvider.summary(sessionId, sessionName)
      return report
    } catch {
      snackbarStore.open('שגיאה ביצירת הדוח', 'error')
      return null
    } finally {
      isGeneratingSummary.value = false
    }
  }

  // Generate + send a self-update WhatsApp link to an employee
  const handleSendLink = async (employee: IEmployee) => {
    sendingLinkId.value = employee.id
    try {
      const result = await employeeProvider.link(employee.id)
      if (result.success) {
        snackbarStore.open('הקישור נשלח בהצלחה', 'success')
      } else {
        snackbarStore.open(result.message || 'שגיאה בשליחת הקישור', 'error')
      }
    } catch {
      snackbarStore.open('שגיאה בשליחת הקישור', 'error')
    } finally {
      sendingLinkId.value = null
    }
  }

  return {
    ...base,
    isGeneratingSummary,
    handleSummary,
    sendingLinkId,
    handleSendLink,
    employeeFields,
    employeeInitialState,
  }
}
