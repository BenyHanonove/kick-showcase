import { ConsumeDto } from '@dtos/consume/consume.dto';
import { ProductDto } from '@dtos/product/product.dto';
import { SaleDto } from '@dtos/sale/sale.dto';
import { SessionDto } from '@dtos/session/session.dto';
import { SupplierDto } from '@dtos/supplier/supplier.dto';

export interface SupplierReportLine {
    product: ProductDto;
    consume: ConsumeDto;
    quantity: number; // arrived - left (what the supplier actually billed)
    total: number;    // quantity * chargedPrice
}

export interface ProductConsume extends ConsumeDto {
    name: string
}

// One event (session or sale) in the supplier report, with the supplier's consumes in it
export interface SupplierEventReport {
    event: SessionDto | SaleDto;
    consumes: ProductConsume[];
}

// Everything the PDF generator needs to lay out one supplier's monthly report
export interface SupplierReportData {
    supplier: SupplierDto;
    monthYear: string; // YYYY-MM
    events: SupplierEventReport[];
}