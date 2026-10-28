// Import validation rules
import { rules } from '@shared/utils/rules.util'

// Import stores
import { ReservationsStore } from '@stores'

// Import providers
import { reservationProvider } from '@reservation/providers/reservation.provider'

// Import composables
import { useCrud } from '@shared/composables/crud.composable'

// Import types
import type { ICreateReservation } from '@reservation/types/IReservation.types'
import {
  ReservationEventType,
  ReservationEventTypeLabels,
} from '@reservation/types/ReservationEventType.types'
import {
  ReservationStatus,
  ReservationStatusLabels,
} from '@reservation/types/ReservationStatus.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export reservation crud composable
export const useReservationCrud = () => {
  const crud = useCrud(reservationProvider, ReservationsStore())

  const reservationInitialState: ICreateReservation = {
    fullName: '',
    phone: '',
    eventType: ReservationEventType.WEDDING,
    eventDate: '',
    guestCount: undefined,
    location: '',
    notes: '',
  }

  const eventTypeOptions = Object.values(ReservationEventType).map((val) => ({
    title: ReservationEventTypeLabels[val],
    value: val,
  }))

  const statusOptions = Object.values(ReservationStatus).map((val) => ({
    title: ReservationStatusLabels[val],
    value: val,
  }))

  const reservationFields: IFormField[] = [
    {
      key: 'fullName',
      label: 'שם מלא*',
      type: 'text',
      rules: [rules.required()],
    },
    {
      key: 'phone',
      label: 'מספר טלפון*',
      type: 'text',
      rules: [rules.required(), rules.phone()],
    },
    {
      key: 'eventType',
      label: 'סוג האירוע*',
      type: 'select',
      items: eventTypeOptions,
      rules: [rules.required('חובה לבחור סוג אירוע')],
    },
    {
      key: 'eventDate',
      label: 'תאריך משוער',
      type: 'date',
    },
    {
      key: 'guestCount',
      label: 'מספר אורחים משוער',
      type: 'number',
    },
    {
      key: 'location',
      label: 'אזור / מקום האירוע',
      type: 'text',
    },
    {
      key: 'notes',
      label: 'הערות',
      type: 'textarea',
    },
  ]

  // Status is server-owned on create, so it only shows up when editing a lead
  const reservationUpdateFields: IFormField[] = [
    ...reservationFields,
    {
      key: 'status',
      label: 'סטטוס',
      type: 'select',
      items: statusOptions,
    },
  ]

  return {
    ...crud,
    reservationFields,
    reservationUpdateFields,
    reservationInitialState,
  }
}
