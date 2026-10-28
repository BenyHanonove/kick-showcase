export interface ICreateSupplier {
  name: string
  phone: string
  contactName: string
  address: string
  notes?: string
}

export interface IUpdateSupplier {
  id: string
  timestamp: string
  name?: string
  phone?: string
  contactName?: string
  address?: string
  notes?: string
}

export interface ISupplier extends ICreateSupplier {
  id: string
  timestamp: string
}
