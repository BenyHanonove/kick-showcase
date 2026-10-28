import type { ReservationEventType } from '@reservation/types/ReservationEventType.types'
import type { ReservationStatus } from '@reservation/types/ReservationStatus.types'

export interface ICreateReservation {
  fullName: string
  phone: string
  eventType: ReservationEventType
  eventDate?: string
  guestCount?: number
  location?: string
  notes?: string
  marketingConsent?: boolean
  marketingConsentAt?: string
}

export interface IUpdateReservation {
  id: string
  timestamp: string
  fullName?: string
  phone?: string
  eventType?: ReservationEventType
  eventDate?: string
  guestCount?: number
  location?: string
  notes?: string
  status?: ReservationStatus
}

export interface IReservation extends ICreateReservation {
  id: string
  timestamp: string
  status: ReservationStatus
}
