// Import repository
import SaleRepository from '@sale/repository/sale.repository'

// Import base provider
import { BaseCrudProvider, type IProviderResult } from '@shared/providers/base.provider'

// Import types
import type { ISale, ICreateSale, IUpdateSale, ISaleSummary } from '@sale/types/ISale.types'
import type { ISaleFilters, ISaleRepository } from '@sale/types/ISaleRepository.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Extend base provider
class SaleProvider extends BaseCrudProvider<
  ISale,
  ICreateSale,
  IUpdateSale,
  ISale,
  ISaleFilters,
  ISaleRepository
> {
  constructor() {
    super(SaleRepository)
  }

  // Method to download sale summary
  async summary(saleId: string): Promise<ISummaryReport> {
    return this.repository.summary(saleId)
  }

  // Method to load per-sale cost/sold summary for a given month
  async summaryByMonth(monthYear: string): Promise<IProviderResult<ISaleSummary[]>> {
    return this.safeCall(this.repository.summaryByMonth(monthYear))
  }
}

export const saleProvider = new SaleProvider()
