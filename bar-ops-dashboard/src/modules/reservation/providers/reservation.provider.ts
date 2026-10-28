// Import repository
import reservationRepository from '@reservation/repository/reservation.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type {
  IReservation,
  ICreateReservation,
  IUpdateReservation,
} from '@reservation/types/IReservation.types'

// Extend base provider
export const reservationProvider = new BaseCrudProvider<
  IReservation,
  ICreateReservation,
  IUpdateReservation
>(reservationRepository)
