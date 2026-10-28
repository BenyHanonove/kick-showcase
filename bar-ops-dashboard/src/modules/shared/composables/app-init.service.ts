import {
  AuthStore,
  ClientsStore,
  EmployeesStore,
  ProductsStore,
  ReservationsStore,
  SessionsStore,
  SalesStore,
  SuppliersStore,
  WebSocketStore,
  MissionsStore,
  SnackbarStore,
} from '@stores'

import { clientProvider } from '@client/providers/client.provider'
import { employeeProvider } from '@employee/providers/employee.provider'
import { productProvider } from '@product/providers/product.provider'
import { reservationProvider } from '@reservation/providers/reservation.provider'
import { sessionProvider } from '@session/providers/session.provider'
import { saleProvider } from '@sale/providers/sale.provider'
import { supplierProvider } from '@supplier/providers/supplier.provider'
import { missionsProvider } from '@missions/providers/missions.provider'

export const useAppInitialization = () => {
  const authStore = AuthStore()
  const clientsStore = ClientsStore()
  const employeesStore = EmployeesStore()
  const productsStore = ProductsStore()
  const reservationsStore = ReservationsStore()
  const sessionsStore = SessionsStore()
  const salesStore = SalesStore()
  const suppliersStore = SuppliersStore()
  const missionsStore = MissionsStore()
  const snackbarStore = SnackbarStore()

  // Helper to run an initialization task with proper typing

  const runTask = async <T>(
    name: string,
    store: {
      set: (data: T) => void
      setError: (error: Error | null) => void
      setLoading: (loading: boolean) => void
    },
    task: () => Promise<{ success: boolean; message: string; data: T | null }>,
  ) => {
    store.setLoading(true)
    try {
      const result = await task()
      if (result.success && result.data) {
        store.set(result.data)
        store.setError(null)
      } else {
        snackbarStore.open(`טעינת ${name} נכשלה: ${result.message}`, 'error')
        store.setError(new Error(result.message))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      snackbarStore.open(`שגיאה בטעינת ${name}: ${errorMessage}`, 'error')
      store.setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      store.setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    // Instantiate WebSocket integration during dashboard data initialization
    WebSocketStore()

    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    await Promise.allSettled([
      runTask('Clients', clientsStore, () => clientProvider.list([])),
      runTask('Employees', employeesStore, () => employeeProvider.list([])),
      runTask('Products', productsStore, () => productProvider.list([])),
      runTask('Leads', reservationsStore, () => reservationProvider.list([])),
      runTask('Sessions', sessionsStore, () => sessionProvider.list({ monthYear })),
      ...(authStore.isAdmin
        ? [runTask('Sales', salesStore, () => saleProvider.list({ monthYear }))]
        : []),
      runTask('Suppliers', suppliersStore, () => supplierProvider.list()),
      runTask('Missions', missionsStore, () => missionsProvider.list({ monthYear })),
    ])
  }

  return {
    loadDashboardData,
  }
}
