import { createPinia } from 'pinia'

// Pinia plugin for persisting store state (e.g. localStorage)
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Central export for all Pinia stores (re-routed from their modular locations)
export { AuthStore, RoleLevel } from '@auth/index'
export { ClientsStore } from '@client/index'
export { EmployeesStore } from '@employee/index'
export { SessionStore, SessionsStore } from '@session/index'
export { SaleStore, SalesStore } from '@sale/index'
export { ProductsStore } from '@product/index'
export { ReservationsStore } from '@reservation/index'
export { SuppliersStore } from '@supplier/index'
export { MissionsStore } from '@missions/index'
export { SnackbarStore, WebSocketStore } from '@shared/index'

// Initialize Pinia with persisted state support
export const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
