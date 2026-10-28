import type { IApiResponse } from '@shared/types/IApiResponse.types'
import type { IProduct, ICreateProduct, IUpdateProduct } from './IProduct.types'

// Define repository interface
export interface IProductRepository {
  create(data: ICreateProduct): Promise<IApiResponse<IProduct>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IProduct>>
  list(ids?: string[]): Promise<IApiResponse<IProduct[]>>
  update(id: string, data: IUpdateProduct): Promise<IApiResponse<IProduct>>
}
