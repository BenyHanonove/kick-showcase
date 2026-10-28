// Import repository
import supplierRepository from '@supplier/repository/supplier.repository'

// Import base provider
import { BaseCrudProvider } from '@shared/providers/base.provider'

// Import types
import type { ISupplier, ICreateSupplier, IUpdateSupplier } from '@supplier/types/ISupplier.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Extend base provider
class SupplierProvider extends BaseCrudProvider<ISupplier, ICreateSupplier, IUpdateSupplier> {
  constructor() {
    super(supplierRepository)
  }

  // Method to download supplier summary
  async summary(id: string, monthYear: string): Promise<ISummaryReport> {
    return (this.repository as typeof supplierRepository).summary(id, monthYear)
  }
}

export const supplierProvider = new SupplierProvider()
