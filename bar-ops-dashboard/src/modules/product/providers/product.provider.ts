// Import repository
import productRepository from '@product/repository/product.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { IProduct, ICreateProduct, IUpdateProduct } from '@product/types/IProduct.types'

// Extend base provider
export const productProvider = new BaseCrudProvider<IProduct, ICreateProduct, IUpdateProduct>(
  productRepository,
)
