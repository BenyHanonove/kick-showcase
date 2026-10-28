import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { env } from '@plugins'

import {
  AuthStore,
  ClientsStore,
  EmployeesStore,
  ProductsStore,
  ReservationsStore,
  SessionsStore,
  SalesStore,
  SuppliersStore,
  SessionStore,
  SaleStore,
} from '@stores'

import { useTokenManager } from '@auth/composables/token.manager'
import { tokenMemory } from '@auth/composables/token.memory'

import { clientProvider } from '@client/providers/client.provider'
import { employeeProvider } from '@employee/providers/employee.provider'
import { productProvider } from '@product/providers/product.provider'
import { reservationProvider } from '@reservation/providers/reservation.provider'
import { sessionProvider } from '@session/providers/session.provider'
import { saleProvider } from '@sale/providers/sale.provider'
import { supplierProvider } from '@supplier/providers/supplier.provider'
import { shiftProvider } from '@shift/providers/shift.provider'
import { cashierProvider } from '@cashier/providers/cashier.provider'
import { consumeProvider } from '@consume/providers/consume.provider'
import { expenseProvider } from '@expense/providers/expense.provider'
import { tipsProvider } from '@tips/providers/tips.provider'
import { missionsProvider } from '@missions/providers/missions.provider'
import { vehicleProvider } from '@vehicle/providers/vehicle.provider'
import { documentProvider } from '@document/providers/document.provider'

// Broadcast change notification: id + module only, no entity data
export interface SocketChange {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  targetStore: string
  id: string
  editor?: string
}

// Helper to extract Cognito sub from JWT
function extractCognitoSub(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.sub || null
  } catch {
    return null
  }
}

interface EntityStoreLike<TEntity> {
  add(item: TEntity): void
  update(item: TEntity): void
  remove(id: string): void
}

// Resolves entity data through the provider (RolesGuard applies)
interface StoreConfig {
  sync(action: 'CREATE' | 'UPDATE' | 'DELETE', id: string): Promise<void>
}

export const WebSocketStore = defineStore(
  'websocket',
  () => {
    const authStore = AuthStore()
    const tokenManager = useTokenManager()

    // Connection status state
    const isConnected = ref(false)
    const isConnecting = ref(false)

    // Active room (session/sale id) — mirrors the server-side connection row
    const currentRoomId = ref<string | null>(null)

    let socket: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0

    const BASE_RETRY_DELAY = 1000 // 1 second
    const MAX_RETRY_DELAY = 30000 // 30 seconds

    // Helper creator to generate type-safe synchronization configurations
    function createSyncConfig<TEntity extends { id: string }>(
      getStore: () => EntityStoreLike<TEntity>,
      provider: {
        get(id: string): Promise<{ success: boolean; data: TEntity | null; message: string }>
      },
      onSync?: (
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        id: string,
        data?: TEntity,
      ) => Promise<void>,
    ): StoreConfig {
      return {
        sync: async (action, id) => {
          const store = getStore()
          if (action === 'DELETE') {
            store.remove(id)
            if (onSync) await onSync('DELETE', id)
            return
          }
          // Fetch through the provider so role guards decide visibility
          const res = await provider.get(id)
          if (!res.success || !res.data) return
          if (action === 'CREATE') {
            store.add(res.data)
          } else {
            store.update(res.data)
          }
          if (onSync) await onSync(action, id, res.data)
        },
      }
    }

    // Consumes belong to the active sale or session (sale reuses sessionId)
    const consumeConfig: StoreConfig = {
      sync: async (action, id) => {
        if (action === 'DELETE') {
          // No payload on delete — clear from both possible targets
          SessionStore().consumes.remove(id)
          SaleStore().consumes.remove(id)
          return
        }
        const res = await consumeProvider.get(id)
        if (!res.success || !res.data) return
        const saleStore = SaleStore()
        const target =
          saleStore.sale?.id === res.data.sessionId ? saleStore.consumes : SessionStore().consumes
        if (action === 'CREATE') {
          target.add(res.data)
        } else {
          target.update(res.data)
        }
      },
    }

    const sessionSyncConfig = createSyncConfig(
      () => SessionsStore(),
      sessionProvider,
      async (action, id, data) => {
        const activeSessionStore = SessionStore()
        if (activeSessionStore.session?.id === id) {
          if (action === 'DELETE') {
            activeSessionStore.reset()
          } else if (action === 'UPDATE' && data) {
            activeSessionStore.setSession(data)
          }
        }
      },
    )

    const saleSyncConfig = createSyncConfig(
      () => SalesStore(),
      saleProvider,
      async (action, id, data) => {
        const activeSaleStore = SaleStore()
        if (activeSaleStore.sale?.id === id) {
          if (action === 'DELETE') {
            activeSaleStore.reset()
          } else if (action === 'UPDATE' && data) {
            activeSaleStore.setSale(data)
          }
        }
      },
    )

    // Map targets to their stores and providers
    const storeMap: Record<string, StoreConfig> = {
      product: createSyncConfig(() => ProductsStore(), productProvider),
      products: createSyncConfig(() => ProductsStore(), productProvider),

      client: createSyncConfig(() => ClientsStore(), clientProvider),
      clients: createSyncConfig(() => ClientsStore(), clientProvider),

      employee: createSyncConfig(() => EmployeesStore(), employeeProvider),
      employees: createSyncConfig(() => EmployeesStore(), employeeProvider),

      supplier: createSyncConfig(() => SuppliersStore(), supplierProvider),
      suppliers: createSyncConfig(() => SuppliersStore(), supplierProvider),

      // Leads are global — no room scoping, every connected user sees them
      reservation: createSyncConfig(() => ReservationsStore(), reservationProvider),
      reservations: createSyncConfig(() => ReservationsStore(), reservationProvider),

      session: sessionSyncConfig,
      sessions: sessionSyncConfig,

      sale: saleSyncConfig,
      sales: saleSyncConfig,

      shift: createSyncConfig(() => SessionStore().shifts, shiftProvider),
      shifts: createSyncConfig(() => SessionStore().shifts, shiftProvider),

      cashier: createSyncConfig(() => SessionStore().cashiers, cashierProvider),
      cashiers: createSyncConfig(() => SessionStore().cashiers, cashierProvider),

      consume: consumeConfig,
      consumes: consumeConfig,

      expense: createSyncConfig(() => SessionStore().expenses, expenseProvider),
      expenses: createSyncConfig(() => SessionStore().expenses, expenseProvider),

      tips: createSyncConfig(() => SessionStore().tips, tipsProvider),

      mission: createSyncConfig(() => SessionStore().missions, missionsProvider),
      missions: createSyncConfig(() => SessionStore().missions, missionsProvider),

      vehicle: createSyncConfig(() => SessionStore().vehicles, vehicleProvider),
      vehicles: createSyncConfig(() => SessionStore().vehicles, vehicleProvider),

      document: createSyncConfig(() => SessionStore().documents, documentProvider),
      documents: createSyncConfig(() => SessionStore().documents, documentProvider),
    }

    // Handle DB change notifications silently, no UI alerts
    const handleBroadcast = async (changes: SocketChange[]) => {
      const token = tokenMemory.tokens.value?.IdToken
      const currentUserSub = token ? extractCognitoSub(token) : null

      for (const change of changes) {
        const { action, targetStore, id, editor } = change

        // Skip all self-originated events (CREATE, UPDATE, DELETE)
        if (editor && editor === currentUserSub) {
          continue
        }

        const config = storeMap[targetStore.toLowerCase()]
        if (!config) continue

        try {
          await config.sync(action, id)
        } catch {
          // Sync failures stay silent — the next broadcast or page load recovers
        }
      }
    }

    // Push the current room membership to the server
    const sendRoomState = () => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return
      if (currentRoomId.value) {
        socket.send(JSON.stringify({ action: 'joinRoom', roomId: currentRoomId.value }))
      } else {
        socket.send(JSON.stringify({ action: 'leaveRoom' }))
      }
    }

    // Enter/leave a room (null leaves); resent on reconnect
    const setRoom = (roomId: string | null) => {
      if (currentRoomId.value === roomId) return
      currentRoomId.value = roomId
      sendRoomState()
    }

    // Schedule a connection retry with backoff delay
    const scheduleReconnect = () => {
      if (!authStore.user) return

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }

      const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY)
      retryCount++

      reconnectTimeout = setTimeout(async () => {
        try {
          await connect()
        } catch {
          // Silent — backoff keeps retrying
        }
      }, delay)
    }

    // Connect to WebSocket gateway
    const connect = async () => {
      try {
        // Ensure token is valid/refreshed before connecting
        await tokenManager.ensureTokenValid()
      } catch {
        // Silent — connection attempt below fails and reschedules
      }

      const token = tokenMemory.tokens.value?.IdToken
      if (!token) return

      if (socket || isConnecting.value || isConnected.value) return

      isConnecting.value = true

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }

      try {
        // Token travels in the protocol offer, not the URL
        const ws = new WebSocket(env.websocket.url, ['barops-auth', token])
        socket = ws

        ws.onopen = () => {
          isConnected.value = true
          isConnecting.value = false
          retryCount = 0

          // Rejoin the room if the user was already inside one
          if (currentRoomId.value) {
            sendRoomState()
          }
        }

        ws.onmessage = async (event) => {
          try {
            const payload = JSON.parse(event.data)
            if (Array.isArray(payload)) {
              await handleBroadcast(payload)
            }
          } catch {
            // Malformed messages are dropped silently
          }
        }

        ws.onclose = () => {
          // A replaced socket closing late must not drop the current one
          if (socket !== ws) return

          isConnected.value = false
          isConnecting.value = false
          socket = null

          // Trigger reconnect if user remains authenticated
          scheduleReconnect()
        }
      } catch {
        isConnecting.value = false
        socket = null
        scheduleReconnect()
      }
    }

    // Terminate active connection
    const disconnect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      if (socket) {
        const ws = socket
        socket = null
        ws.close()
      }
      isConnected.value = false
      isConnecting.value = false
      retryCount = 0
    }

    // Set up watchers for auth state updates
    watch(
      () => tokenMemory.tokens.value?.IdToken,
      async (newToken) => {
        // A refreshed token keeps the open socket; auth is checked only on $connect
        if (newToken) {
          await connect()
        } else {
          disconnect()
        }
      },
      { immediate: true },
    )

    return {
      isConnected,
      isConnecting,
      currentRoomId,
      setRoom,
      connect,
      disconnect,
    }
  },
  { persist: false },
)
