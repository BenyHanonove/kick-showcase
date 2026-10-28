import reservationRepository from '@reservation/repository/reservation.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type {
  IReservation,
  ICreateReservation,
  IUpdateReservation,
} from '@reservation/types/IReservation.types'

export const reservationProvider = new BaseCrudProvider<
  IReservation,
  ICreateReservation,
  IUpdateReservation
>(reservationRepository)
