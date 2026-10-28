import { rules } from '@shared/utils/rules.util'

import { useCrud } from '@shared/composables/crud.composable'

import { vehicleProvider } from '@vehicle/providers/vehicle.provider'

import type { ICrudStore } from '@shared/types/ICrud.types'
import type { IVehicle, ICreateVehicle, IUpdateVehicle } from '@vehicle/types/IVehicle.types'
import type { IFormField } from '@shared/types/IForm.types'

// Export vehicle crud composable
export function useVehicleCrud(store: ICrudStore<IVehicle>) {
  const base = useCrud<IVehicle, ICreateVehicle, IUpdateVehicle>(
    vehicleProvider,
    store,
    undefined,
    () => vehicleFields,
  )

  // Vehicle form configuration
  const vehicleFields: IFormField[] = [
    {
      key: 'desc',
      label: 'תיאור',
      type: 'text',
    },
    {
      key: 'driverShiftId',
      label: 'נהג',
      type: 'select',
      props: { clearable: true },
    },
    {
      key: 'sum',
      label: 'סכום*',
      type: 'number',
      props: { prefix: '₪' },
      rules: [rules.required(), rules.minNumber(0)],
    },
    {
      key: 'licensePlate',
      label: 'מספר רישוי',
      type: 'text',
    },
  ]

  const vehicleInitialState = (sessionId: string): ICreateVehicle => ({
    sessionId,
    desc: '',
    driverShiftId: '',
    sum: 0,
    licensePlate: '',
  })

  return {
    ...base,
    vehicleFields,
    vehicleInitialState,
  }
}
