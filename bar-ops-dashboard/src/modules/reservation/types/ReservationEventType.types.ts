// Define reservation event type enum
export enum ReservationEventType {
  WEDDING = 'wedding',
  COMPANY = 'company',
  PRIVATE = 'private',
  PRODUCTION = 'production',
  OTHER = 'other',
}

// Define reservation event type translation labels
export const ReservationEventTypeLabels: Record<ReservationEventType, string> = {
  [ReservationEventType.WEDDING]: 'חתונה',
  [ReservationEventType.COMPANY]: 'אירוע חברה',
  [ReservationEventType.PRIVATE]: 'מסיבה פרטית',
  [ReservationEventType.PRODUCTION]: 'הפקה / פסטיבל',
  [ReservationEventType.OTHER]: 'אחר',
}
