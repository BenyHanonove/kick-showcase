import vehicleRepository from '@vehicle/repository/vehicle.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IVehicle, ICreateVehicle, IUpdateVehicle } from '@vehicle/types/IVehicle.types'
import type { IVehicleFilters, IVehicleRepository } from '@vehicle/types/IVehicleRepository.types'

export const vehicleProvider = new BaseCrudProvider<
  IVehicle,
  ICreateVehicle,
  IUpdateVehicle,
  IVehicle,
  IVehicleFilters,
  IVehicleRepository
>(vehicleRepository)
