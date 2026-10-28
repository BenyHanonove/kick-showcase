export interface ICreateVehicle {
  sessionId: string
  desc?: string
  driverShiftId?: string
  sum: number
  licensePlate?: string
}

export interface IUpdateVehicle {
  id: string
  timestamp: string
  desc?: string
  driverShiftId?: string
  sum?: number
  licensePlate?: string
  passengerShiftIds?: string[]
}

export interface IVehicle extends ICreateVehicle {
  id: string
  passengerShiftIds: string[]
  timestamp: string
}
