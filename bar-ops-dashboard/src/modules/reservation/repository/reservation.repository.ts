// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type {
  IReservation,
  ICreateReservation,
  IUpdateReservation,
} from '@reservation/types/IReservation.types'
import type { IReservationRepository } from '@reservation/types/IReservationRepository.types'

// Extend base repository
const reservationRepository: IReservationRepository = new BaseRepository<
  IReservation,
  ICreateReservation,
  IUpdateReservation
>('/reservation', 'reservations', 'reservation')

export default reservationRepository
