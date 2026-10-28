import { BaseRepository } from '@shared/repository/base.repository'

import type { IProduct, ICreateProduct, IUpdateProduct } from '@product/types/IProduct.types'
import type { IProductRepository } from '@product/types/IProductRepository.types'

const productRepository: IProductRepository = new BaseRepository<
  IProduct,
  ICreateProduct,
  IUpdateProduct
>('/product', 'products', 'product')

export default productRepository
