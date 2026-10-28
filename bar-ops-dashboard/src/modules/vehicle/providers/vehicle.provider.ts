// Import repository
import vehicleRepository from '@vehicle/repository/vehicle.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { IVehicle, ICreateVehicle, IUpdateVehicle } from '@vehicle/types/IVehicle.types'
import type { IVehicleFilters, IVehicleRepository } from '@vehicle/types/IVehicleRepository.types'

// Extend base provider
export const vehicleProvider = new BaseCrudProvider<
  IVehicle,
  ICreateVehicle,
  IUpdateVehicle,
  IVehicle,
  IVehicleFilters,
  IVehicleRepository
>(vehicleRepository)
