// Import resource data transfer objects for payload transformation and validation
import { CashierDto } from '@dtos/cashier/cashier.dto';
import { ClientDto } from '@dtos/client/client.dto';
import { ConsumeDto } from '@dtos/consume/consume.dto';
import { ExpenseDto } from '@dtos/expense/expense.dto';
import { ProductDto } from '@dtos/product/product.dto';
import { SessionDto } from '@dtos/session/session.dto';

export interface EventReportData {
    cashiers: CashierDto[];
    client: ClientDto;
    consumes: ConsumeDto[];
    expenses: ExpenseDto[];
    products: ProductDto[];
    session: SessionDto;
}

export interface EnrichedConsume {
    consume: ConsumeDto;
    product: ProductDto;
}