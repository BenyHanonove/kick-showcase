// Define reservation lead status enum
export enum ReservationStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUOTED = 'quoted',
  CLOSED = 'closed',
}

// Define reservation status translation labels
export const ReservationStatusLabels: Record<ReservationStatus, string> = {
  [ReservationStatus.NEW]: 'חדש',
  [ReservationStatus.CONTACTED]: 'יצרנו קשר',
  [ReservationStatus.QUOTED]: 'נשלחה הצעה',
  [ReservationStatus.CLOSED]: 'סגור',
}

// Chip colors per status, matching the dashboard palette
export const ReservationStatusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.NEW]: 'primary',
  [ReservationStatus.CONTACTED]: 'info',
  [ReservationStatus.QUOTED]: 'warning',
  [ReservationStatus.CLOSED]: 'success',
}
