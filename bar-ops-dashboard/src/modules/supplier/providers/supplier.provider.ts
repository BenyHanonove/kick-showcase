import supplierRepository from '@supplier/repository/supplier.repository'

import { BaseCrudProvider } from '@shared/providers/base.provider'

import type { ISupplier, ICreateSupplier, IUpdateSupplier } from '@supplier/types/ISupplier.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

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
