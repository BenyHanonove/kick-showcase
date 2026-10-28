// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { IVehicle, ICreateVehicle, IUpdateVehicle } from '@vehicle/types/IVehicle.types'
import type { IVehicleRepository, IVehicleFilters } from '@vehicle/types/IVehicleRepository.types'

// Extend base repository
const vehicleRepository: IVehicleRepository = new BaseRepository<
  IVehicle,
  ICreateVehicle,
  IUpdateVehicle,
  IVehicle,
  IVehicleFilters
>('/vehicle', 'vehicles', 'vehicle')

export default vehicleRepository
