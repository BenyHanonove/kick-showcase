import { ref } from 'vue'

import { cashierProvider } from '@cashier/providers/cashier.provider'
import { consumeProvider } from '@consume/providers/consume.provider'
import { expenseProvider } from '@expense/providers/expense.provider'
import { sessionProvider } from '@session/providers/session.provider'
import { shiftProvider } from '@shift/providers/shift.provider'
import { tipsProvider } from '@tips/providers/tips.provider'
import { clientProvider } from '@client/providers/client.provider'
import { missionsProvider } from '@missions/providers/missions.provider'
import { vehicleProvider } from '@vehicle/providers/vehicle.provider'
import { documentProvider } from '@document/providers/document.provider'

import { SessionStore, AuthStore, EmployeesStore, ClientsStore, SnackbarStore } from '@stores'

import { useFormatter } from '@shared/composables/useFormatter.composable'

import { type IShift } from '@shift/types/IShift.types'

interface ShiftWithTitle extends IShift {
  title: string
}

export const useSessionLoader = () => {
  const session = SessionStore()
  const auth = AuthStore()
  const employeesStore = EmployeesStore()
  const clientsStore = ClientsStore()
  const isInitialLoading = ref(false)
  const { sortArrayByTitle } = useFormatter()

  const loadFullSession = async (sessionId: string, clientId: string) => {
    const isDifferentSession = session.session?.id !== sessionId
    const isStoreEmpty =
      !session.session || !session.shifts.data || session.shifts.data.length === 0
    if (isDifferentSession || isStoreEmpty) {
      isInitialLoading.value = true
    }
    const isManager = auth.isManager
    const isAdmin = auth.isAdmin

    try {
      const [
        sessionRes,
        shiftRes,
        cashierRes,
        consumes,
        expenseRes,
        tipsRes,
        clientsRes,
        missionsRes,
        vehiclesRes,
        documentsRes,
      ] = await Promise.all([
        sessionProvider.get(sessionId),
        shiftProvider.list({ sessionId }),
        cashierProvider.list({ sessionId }),
        consumeProvider.list({ sessionId }),
        isManager ? expenseProvider.list({ sessionId }) : null,
        isManager ? tipsProvider.list({ sessionId }) : null,
        clientsStore.clients?.length ? null : clientProvider.list([]),
        missionsProvider.list({ sessionId }),
        vehicleProvider.list({ sessionId }),
        isAdmin ? documentProvider.list({ sessionId }) : null,
      ])

      const shifts = shiftRes.success && shiftRes.data ? shiftRes.data : []

      void clientId

      const employees = employeesStore.employees || []

      if (clientsRes?.success && clientsRes.data) {
        clientsStore.set(clientsRes.data)
      }

      const sortedShifts = sortArrayByTitle(
        'title',
        shifts.map((s): ShiftWithTitle => {
          const emp = employees.find((e) => e.id === s.employeeId)
          return {
            ...s,
            title: `${emp?.firstName ?? ''} ${emp?.lastName ?? ''}`.trim(),
          }
        }),
      ).map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...originalShift } = s
        return originalShift as IShift
      })

      if (sessionRes.success && sessionRes.data) {
        session.setSession(sessionRes.data)
      }
      session.shifts.set(sortedShifts)
      session.cashiers.set(cashierRes.success && cashierRes.data ? cashierRes.data : [])
      session.consumes.set(consumes.success && consumes.data ? consumes.data : [])
      session.expenses.set(expenseRes?.success && expenseRes.data ? expenseRes.data : [])
      session.tips.set(tipsRes?.success && tipsRes.data ? tipsRes.data : [])
      session.missions.set(missionsRes?.success && missionsRes.data ? missionsRes.data : [])
      session.vehicles.set(vehiclesRes.success && vehiclesRes.data ? vehiclesRes.data : [])
      session.documents.set(documentsRes?.success && documentsRes.data ? documentsRes.data : [])
    } catch (e) {
      SnackbarStore().open('שגיאה בטעינת נתוני האירוע', 'error')
      throw e
    } finally {
      isInitialLoading.value = false
    }
  }

  return {
    loadFullSession,
    isInitialLoading,
  }
}
