import { BaseRepository } from '@shared/repository/base.repository'

import type { IVehicle, ICreateVehicle, IUpdateVehicle } from '@vehicle/types/IVehicle.types'
import type { IVehicleRepository, IVehicleFilters } from '@vehicle/types/IVehicleRepository.types'

const vehicleRepository: IVehicleRepository = new BaseRepository<
  IVehicle,
  ICreateVehicle,
  IUpdateVehicle,
  IVehicle,
  IVehicleFilters
>('/vehicle', 'vehicles', 'vehicle')

export default vehicleRepository
