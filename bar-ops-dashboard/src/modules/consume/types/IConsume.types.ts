// Editable quantity fields on a consume record (derived values are excluded)
export type ConsumeQuantityField =
  | 'target'
  | 'order'
  | 'arrived'
  | 'fromStorage'
  | 'creditedToSupplier'
  | 'returnedToStorage'

export interface ICreateConsume {
  sessionId: string
  productId: string
  chargedPrice?: number
  supplierPrice?: number
  target: number
  order: number
  arrived: number
  fromStorage?: number
  creditedToSupplier: number
  returnedToStorage: number
}

export interface IUpdateConsume {
  id: string
  timestamp: string
  chargedPrice?: number
  supplierPrice?: number
  target?: number
  order?: number
  arrived?: number
  fromStorage?: number
  creditedToSupplier?: number
  returnedToStorage?: number
}

export interface IConsume extends ICreateConsume {
  id: string
  timestamp: string
}
