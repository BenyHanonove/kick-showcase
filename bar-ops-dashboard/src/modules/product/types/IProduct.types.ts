import { ProductType } from '@product/types/ProductType.types'

export interface ICreateProduct {
  supplierId: string
  name: string
  price: number
  volume: number
  type: ProductType
  isBase?: boolean
  quantity?: number
}

export interface IUpdateProduct {
  id: string
  timestamp: string
  supplierId?: string
  name?: string
  price?: number
  volume?: number
  type?: ProductType
  isBase?: boolean
  quantity?: number
}

export interface IProduct extends ICreateProduct {
  id: string
  isBase: boolean
  timestamp: string
}
