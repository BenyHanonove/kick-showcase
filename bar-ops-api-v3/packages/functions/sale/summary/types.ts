import { ClientDto } from '@dtos/client/client.dto';
import { ConsumeDto } from '@dtos/consume/consume.dto';
import { ProductDto } from '@dtos/product/product.dto';
import { SaleDto } from '@dtos/sale/sale.dto';

export interface SaleReportData {
    client: ClientDto;
    consumes: ConsumeDto[];
    products: ProductDto[];
    sale: SaleDto;
}

export interface EnrichedConsume {
    consume: ConsumeDto;
    product: ProductDto;
}
