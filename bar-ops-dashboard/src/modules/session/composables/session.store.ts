import { defineStore } from 'pinia'
import { computed, shallowRef, watch } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'
import { SessionsStore } from './sessions.store'

import type { IShift } from '@shift/types/IShift.types'
import { ShiftRegistration } from '@shift/types/ShiftRegistration.types'
import type { ICashier } from '@cashier/types/ICashier.types'
import type { IExpense } from '@expense/types/IExpense.types'
import type { ITips } from '@tips/types/ITips.types'
import type { ISession } from '@session/types/ISession.types'
import type { IConsume } from '@consume/types/IConsume.types'
import type { IMission } from '@missions/types/IMission.types'
import type { IVehicle } from '@vehicle/types/IVehicle.types'
import type { IDocument } from '@document/types/IDocument.types'

export const SessionStore = defineStore(
  'session',
  () => {
    const session = shallowRef<ISession | null>(null)
    const sessionsStore = SessionsStore()

    watch(
      () => sessionsStore.sessions,
      (newSessions) => {
        if (newSessions && session.value) {
          const found = newSessions.find((s) => s.id === session.value?.id)
          if (found) {
            session.value = found
          }
        }
      },
      { deep: true },
    )

    const setSession = (data: ISession) => {
      session.value = data
    }

    const shifts = createEntityStore<IShift>()
    const cashiers = createEntityStore<ICashier>()
    const consumes = createEntityStore<IConsume>()
    const expenses = createEntityStore<IExpense>((a, b) => a.name.localeCompare(b.name, 'he'))
    const tips = createEntityStore<ITips>()
    const missions = createEntityStore<IMission>((a, b) => b.monthYear.localeCompare(a.monthYear))
    const vehicles = createEntityStore<IVehicle>()
    const documents = createEntityStore<IDocument>()

    // Shifts with a valid registration; missing value = created before registrations
    const registeredShifts = computed(() =>
      (shifts.data.value || []).filter(
        (s) => s.registration !== ShiftRegistration.PENDING && s.registration !== ShiftRegistration.REJECTED,
      ),
    )

    const reset = () => {
      session.value = null
      shifts.reset()
      cashiers.reset()
      consumes.reset()
      expenses.reset()
      tips.reset()
      missions.reset()
      vehicles.reset()
      documents.reset()
    }

    return {
      session,
      setSession,
      shifts,
      registeredShifts,
      cashiers,
      consumes,
      expenses,
      tips,
      missions,
      vehicles,
      documents,
      reset,
    }
  },
  {
    persist: {
      pick: ['session'],
    },
  },
)
