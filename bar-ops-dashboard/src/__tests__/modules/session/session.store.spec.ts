import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { nextTick, createApp } from 'vue'
import { SessionStore } from '../../../modules/session/composables/session.store'
import type { ISession } from '../../../modules/session/types/ISession.types'
import { SessionType } from '../../../modules/session/types/SessionType.types'
import { SessionStatus } from '../../../modules/session/types/status.types'
import type { IShift } from '../../../modules/shift/types/IShift.types'
import { ShiftRole } from '../../../modules/shift/types/ShiftRole.types'

// Mock localStorage for jsdom/vitest environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})
global.localStorage = localStorageMock as unknown as Storage

describe('SessionStore Persistence and Hydration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('hydrates session ref and preserves all unpersisted entity store helpers', async () => {
    // 1. Initialize Pinia and store on a dummy Vue app
    const app1 = createApp({})
    const pinia1 = createPinia()
    pinia1.use(piniaPluginPersistedstate)
    app1.use(pinia1)
    setActivePinia(pinia1)

    const store1 = SessionStore()

    // Verify initial helper functions exist
    expect(typeof store1.shifts.set).toBe('function')
    expect(typeof store1.shifts.add).toBe('function')
    expect(typeof store1.shifts.update).toBe('function')

    // 2. Populate data
    const dummySession: ISession = {
      id: 'session-123',
      clientId: 'client-1',
      name: 'Test Event',
      peopleAmount: 100,
      location: 'Main Hall',
      processingFee: 0,
      type: SessionType.TECHNO,
      status: SessionStatus.ACTIVE,
      timestamp: new Date().toISOString(),
      datetime: new Date().toISOString(),
    }

    const dummyShift: IShift = {
      id: 'shift-1',
      sessionId: 'session-123',
      employeeId: 'emp-1',
      approved: false,
      timestamp: String(Date.now()),
      role: ShiftRole.BARTENDER,
      received: false,
      notes: '',
      totalHours: 0,
      hourly: null,
    }

    store1.setSession(dummySession)
    store1.shifts.set([dummyShift])

    await nextTick()

    // 3. Simulate page reload / new session
    const app2 = createApp({})
    const pinia2 = createPinia()
    pinia2.use(piniaPluginPersistedstate)
    app2.use(pinia2)
    setActivePinia(pinia2)

    const store2 = SessionStore()

    // 4. Session should hydrate from localStorage
    expect(store2.session).toEqual(dummySession)

    // Shifts reset to null on new page load
    expect(store2.shifts.data).toBeNull()

    // Helper functions must still be present and callable
    expect(typeof store2.shifts.set).toBe('function')
    expect(typeof store2.shifts.add).toBe('function')
    expect(typeof store2.shifts.update).toBe('function')

    // Verify helper functions work without throwing
    expect(() => store2.shifts.add(dummyShift)).not.toThrow()
    expect(store2.shifts.data).toEqual([dummyShift])
  })
})
