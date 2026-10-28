// Import base repository
import { BaseRepository } from '@shared/repository/base.repository'

// Import types
import type { ISupplierRepository } from '@supplier/types/ISupplierRepository.types'
import type { ISupplier, ICreateSupplier, IUpdateSupplier } from '@supplier/types/ISupplier.types'
import type { ISummaryReport } from '@shared/types/ISummaryReport.interface'

// Extend base repository
class SupplierRepository
  extends BaseRepository<ISupplier, ICreateSupplier, IUpdateSupplier>
  implements ISupplierRepository
{
  constructor() {
    super('/supplier', 'suppliers', 'supplier')
  }

  async summary(id: string, monthYear: string): Promise<ISummaryReport> {
    return this.downloadBlob(
      `${this.endpoint}/summary/${id}`,
      `supplier_summary_${id}_${monthYear}.pdf`,
      { monthYear },
    )
  }
}

const supplierRepository = new SupplierRepository()
export default supplierRepository
