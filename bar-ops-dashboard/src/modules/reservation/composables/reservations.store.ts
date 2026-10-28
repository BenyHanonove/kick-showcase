import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createEntityStore } from '../../../config/store/utils/createEntityStore.util'

import type { IReservation } from '@reservation/types/IReservation.types'
import { ReservationStatus } from '@reservation/types/ReservationStatus.types'

export const ReservationsStore = defineStore('reservations', () => {
  // Newest lead first — a lead's worth drops as it ages
  const {
    data: reservations,
    loading,
    error,
    set,
    add,
    update,
    remove,
    get,
    setLoading,
    setError,
    reset,
  } = createEntityStore<IReservation>((a, b) => b.timestamp.localeCompare(a.timestamp))

  const searchQuery = ref('')

  // Filtered reservations list logic
  const filtered = computed(() => {
    if (!searchQuery.value) return reservations.value
    const query = searchQuery.value.toLowerCase()
    return reservations.value?.filter(
      (r) => r.fullName.toLowerCase().includes(query) || r.phone.includes(query),
    )
  })

  // Leads nobody has picked up yet
  const newCount = computed(
    () => reservations.value?.filter((r) => r.status === ReservationStatus.NEW).length ?? 0,
  )

  return {
    reservations,
    loading,
    error,
    searchQuery,
    filtered,
    newCount,
    set,
    add,
    update,
    remove,
    get,
    setLoading,
    setError,
    reset,
  }
})
