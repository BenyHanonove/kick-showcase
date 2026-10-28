import { CashierLocation } from '@dtos/cashier/cashier.enum';
import { CreateCashierDto } from '@dtos/cashier/create.dto';

export function decodeCsvContent(file: string | Buffer | Uint8Array | number[]): string {
    if (typeof file === 'string') {
        if (file.includes(';base64,')) {
            return Buffer.from(file.split(';base64,')[1], 'base64').toString('utf-8');
        }
        return Buffer.from(file, 'base64').toString('utf-8');
    }
    return Buffer.from(file).toString('utf-8');
}

// Parse a raw Z-report file into a CreateCashierDto
export function parseZReportCsv(
    file: string | Buffer | Uint8Array | number[],
    sessionId: string,
    location: CashierLocation
): CreateCashierDto {
    const content = decodeCsvContent(file);
    const lines = content.split('\n');
    const data: Record<string, string[]> = {};

    for (const line of lines) {
        if (!line.trim()) continue;
        const cells = line.split(',').map((cell) => {
            let val = cell.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }
            return val.trim();
        });

        if (cells.length > 1 && cells[0]) {
            data[cells[0]] = cells.slice(1);
        }
    }

    const getSingleVal = (key: string): string => {
        return data[key]?.[0] || '';
    };

    const cleanNum = (val: string): number => {
        if (!val) return 0;
        const cleaned = val.replace(/[\u200e\s,]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const cash = cleanNum(getSingleVal('מזומן'));
    const visa = cleanNum(getSingleVal('ויזה'));
    const mastercard = cleanNum(getSingleVal('מסטרקארד'));
    const amex = cleanNum(getSingleVal('אמקס'));
    const totalTips = cleanNum(getSingleVal('סהכ טיפים') || getSingleVal('טיפ'));
    const registerCode = getSingleVal('קוד קופה');
    
    const storeCode = getSingleVal('קוד חנות');
    const zNumber = getSingleVal('מספר Z') || getSingleVal('מספר z') || getSingleVal('מספר ז') || getSingleVal('מספר זד');

    const credit = visa + mastercard + amex;
    const serial = `${storeCode}-${registerCode}-${zNumber}`;

    const dto = new CreateCashierDto();
    dto.sessionId = sessionId;
    dto.location = location;
    dto.cash = cash;
    dto.credit = credit;
    dto.creditTip = Math.abs(totalTips);
    dto.serial = serial;

    return dto;
}
