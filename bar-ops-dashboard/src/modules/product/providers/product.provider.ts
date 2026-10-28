import productRepository from '@product/repository/product.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { IProduct, ICreateProduct, IUpdateProduct } from '@product/types/IProduct.types'

export const productProvider = new BaseCrudProvider<IProduct, ICreateProduct, IUpdateProduct>(
  productRepository,
)
