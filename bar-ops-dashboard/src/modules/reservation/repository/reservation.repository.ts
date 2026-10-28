import { BaseRepository } from '@shared/repository/base.repository'

import type {
  IReservation,
  ICreateReservation,
  IUpdateReservation,
} from '@reservation/types/IReservation.types'
import type { IReservationRepository } from '@reservation/types/IReservationRepository.types'

const reservationRepository: IReservationRepository = new BaseRepository<
  IReservation,
  ICreateReservation,
  IUpdateReservation
>('/reservation', 'reservations', 'reservation')

export default reservationRepository
