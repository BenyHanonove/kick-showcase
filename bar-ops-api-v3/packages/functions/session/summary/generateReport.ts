// Import external framework dependencies and status codes from third party packages
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import { EnrichedConsume, EventReportData } from './types';

// Import shared AWS services, guard security middleware, and utility helpers
import { FONT_SIZES, COLORS, SPACING, loadFonts, LAYOUT, loadBasePdfFromS3, bidi, PdfFonts } from '@utils/file-generation/pdf.util';

// Import resource data transfer objects for payload transformation and validation
import { ClientDto } from '@dtos/client/client.dto';
import { SessionDto } from '@dtos/session/session.dto';
import { ExpenseDto } from '@dtos/expense/expense.dto';
import { ExpensePaidBy } from '@dtos/expense/expense.enum';
import { CashierDto } from '@dtos/cashier/cashier.dto';

const MONTHS_HE: Record<number, string> = {
    1: "ינואר",
    2: "פברואר",
    3: "מרץ",
    4: "אפריל",
    5: "מאי",
    6: "יוני",
    7: "יולי",
    8: "אוגוסט",
    9: "ספטמבר",
    10: "אוקטובר",
    11: "נובמבר",
    12: "דצמבר"
};

async function drawGeneralInfoPage(
    pdfDoc: PDFDocument,
    session: SessionDto,
    client: ClientDto,
    fonts: PdfFonts,
    externalDoc: PDFDocument
) {
    const { hebrewBoldFont } = fonts;
    const PAGE_AXIS = { x: LAYOUT.TABLE_X_START, y: 800 };

    const [templatePage] = await pdfDoc.copyPages(externalDoc, [0]);
    const page = pdfDoc.addPage(templatePage);

    const dateObj = new Date(session.datetime);
    const day = dateObj.getUTCDate();
    const month = dateObj.getUTCMonth() + 1;
    const year = dateObj.getUTCFullYear();

    const { x, y } = PAGE_AXIS;

    const drawTextRTL = (text: string, xPos: number, yPos: number) => {
        const formatted = bidi(text);
        const width = hebrewBoldFont.widthOfTextAtSize(formatted, FONT_SIZES.TITLE);
        page.drawText(formatted, {
            x: xPos - width,
            y: yPos,
            size: FONT_SIZES.TITLE,
            font: hebrewBoldFont,
            color: COLORS.FONT_LIGHT
        });
    };

    drawTextRTL(client.brand, x, y);
    drawTextRTL(session.name, x, y - SPACING.TITLE_GAP);

    const monthNameHe = MONTHS_HE[month];
    const dateLine = `${day} ${monthNameHe} ${year}`;

    drawTextRTL(dateLine, x, y - (SPACING.TITLE_GAP * 2));
}

async function drawSoftDrinksPage(
    pdfDoc: PDFDocument,
    items: EnrichedConsume[],
    fonts: PdfFonts,
    externalDoc: PDFDocument
): Promise<number> {
    const { hebrewFont, hebrewBoldFont, monoFont } = fonts;
    const textColor = COLORS.FONT_DARK;

    const PAGE_AXIS = { x: LAYOUT.TABLE_X_START, y: 530 };
    const { x, y: startY } = PAGE_AXIS;

    const [templatePage] = await pdfDoc.copyPages(externalDoc, [2]);
    const page = pdfDoc.addPage(templatePage);

    let currentY = startY;
    let grandTotal = 0;

    const xPos = {
        name: x,
        price: x - 130,
        consumed: x - 250,
        total: x - 370
    };

    const headers = [
        { text: 'מוצר', x: xPos.name },
        { text: 'מחיר', x: xPos.price },
        { text: 'נצרך', x: xPos.consumed },
        { text: 'סה"כ', x: xPos.total }
    ];

    headers.forEach(h => {
        const formatted = bidi(h.text);
        const w = hebrewBoldFont.widthOfTextAtSize(formatted, FONT_SIZES.HEADER);
        page.drawText(formatted, { x: h.x - w, y: currentY, size: FONT_SIZES.HEADER, font: hebrewBoldFont, color: textColor });
    });

    currentY -= 20;
    page.drawLine({ start: { x: LAYOUT.MARGIN_LEFT - 20, y: currentY }, end: { x, y: currentY }, thickness: SPACING.LINE_THICKNESS, color: textColor });
    currentY -= 25;

    const drawCenteredMono = (val: string, posX: number, headerText: string, isBold: boolean = false) => {
        const font = isBold ? hebrewBoldFont : monoFont;
        const formattedVal = bidi(val);
        const formattedHeader = bidi(headerText);
        const textWidth = font.widthOfTextAtSize(formattedVal, FONT_SIZES.BODY);
        const headerWidth = hebrewBoldFont.widthOfTextAtSize(formattedHeader, FONT_SIZES.HEADER);
        const centeredX = (posX - (headerWidth / 2)) - (textWidth / 2);
        page.drawText(formattedVal, { x: centeredX, y: currentY, size: FONT_SIZES.BODY, font, color: textColor });
    };

    items.forEach(({ consume, product }) => {
        const consumed = consume.arrived || 0;
        const unitPrice = consume.chargedPrice || 0;
        const totalPrice = unitPrice * consumed;
        grandTotal += totalPrice;

        const nameText = (product?.name || '').split('(')[0];
        const formattedName = bidi(nameText);
        page.drawText(formattedName, {
            x: xPos.name - hebrewFont.widthOfTextAtSize(formattedName, FONT_SIZES.BODY),
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewFont,
            color: textColor
        });

        drawCenteredMono(`${unitPrice} ₪`, xPos.price, 'מחיר');
        drawCenteredMono(consumed.toString(), xPos.consumed, 'נצרך');
        drawCenteredMono(`${totalPrice.toLocaleString()} ₪`, xPos.total, 'סה"כ');

        currentY -= SPACING.ROW_GAP;
    });

    currentY -= 10;
    page.drawLine({ start: { x: LAYOUT.MARGIN_LEFT - 20, y: currentY }, end: { x, y: currentY }, thickness: SPACING.LINE_THICKNESS, color: textColor });
    currentY -= 20;

    const drawTotalLine = (label: string, value: number) => {
        const formattedLabel = bidi(label);
        page.drawText(formattedLabel, {
            x: xPos.consumed - hebrewBoldFont.widthOfTextAtSize(formattedLabel, FONT_SIZES.BODY) + 20,
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewBoldFont,
            color: textColor
        });
        drawCenteredMono(`${Math.round(value).toLocaleString()} ₪`, xPos.total, 'סה"כ', true);
        currentY -= 20;
    };

    drawTotalLine('סה"כ לפני מע"מ:', grandTotal);
    drawTotalLine('סה"כ כולל מע"מ:', grandTotal * 1.18);

    return grandTotal;
}

async function drawAlcoholPage(
    pdfDoc: PDFDocument,
    items: EnrichedConsume[],
    fonts: PdfFonts,
    externalDoc: PDFDocument
): Promise<number> {
    const { hebrewFont, hebrewBoldFont, monoFont } = fonts;
    const textColor = COLORS.FONT_LIGHT;

    const PAGE_AXIS = { x: 570, y: 670 };
    const { x, y: startY } = PAGE_AXIS;

    const [templatePage] = await pdfDoc.copyPages(externalDoc, [3]);
    const page = pdfDoc.addPage(templatePage);

    let currentY = startY;
    let grandTotal = 0;

    const xPos = {
        name: x,
        price: x - 130,
        consumed: x - 250,
        total: x - 370
    };

    const headers = [
        { text: 'מוצר', x: xPos.name },
        { text: 'מחיר', x: xPos.price },
        { text: 'נצרך', x: xPos.consumed },
        { text: 'סה"כ', x: xPos.total }
    ];

    headers.forEach(h => {
        const formatted = bidi(h.text);
        const w = hebrewBoldFont.widthOfTextAtSize(formatted, FONT_SIZES.HEADER);
        page.drawText(formatted, { x: h.x - w, y: currentY, size: FONT_SIZES.HEADER, font: hebrewBoldFont, color: textColor });
    });

    currentY -= 20;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x, y: currentY }, thickness: SPACING.LINE_THICKNESS, color: textColor });
    currentY -= 25;

    const drawCenteredMono = (val: string, posX: number, headerText: string, isBold: boolean = false) => {
        const font = isBold ? hebrewBoldFont : monoFont;
        const formattedVal = bidi(val);
        const formattedHeader = bidi(headerText);
        const textWidth = font.widthOfTextAtSize(formattedVal, FONT_SIZES.BODY);
        const headerWidth = hebrewBoldFont.widthOfTextAtSize(formattedHeader, FONT_SIZES.HEADER);
        const centeredX = (posX - (headerWidth / 2)) - (textWidth / 2);
        page.drawText(formattedVal, { x: centeredX, y: currentY, size: FONT_SIZES.BODY, font, color: textColor });
    };

    items.forEach(({ consume, product }) => {
        const consumed = consume.arrived || 0;
        const unitPrice = consume.chargedPrice || 0;
        const totalPrice = unitPrice * consumed;
        grandTotal += totalPrice;

        const nameText = (product?.name || '').split('(')[0];
        const formattedName = bidi(nameText);
        page.drawText(formattedName, {
            x: xPos.name - hebrewFont.widthOfTextAtSize(formattedName, FONT_SIZES.BODY),
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewFont,
            color: textColor
        });

        drawCenteredMono(`${unitPrice} ₪`, xPos.price, 'מחיר');
        drawCenteredMono(consumed.toString(), xPos.consumed, 'נצרך');
        drawCenteredMono(`${totalPrice.toLocaleString()} ₪`, xPos.total, 'סה"כ');

        currentY -= SPACING.ROW_GAP;
    });

    currentY -= 10;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x, y: currentY }, thickness: SPACING.LINE_THICKNESS, color: textColor });
    currentY -= 20;

    const drawTotalLine = (label: string, value: number) => {
        const formattedLabel = bidi(label);
        page.drawText(formattedLabel, {
            x: (xPos.consumed - hebrewBoldFont.widthOfTextAtSize(formattedLabel, FONT_SIZES.BODY)) + 20,
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewBoldFont,
            color: textColor
        });
        drawCenteredMono(`${Math.round(value).toLocaleString()} ₪`, xPos.total, 'סה"כ', true);
        currentY -= 20;
    };

    drawTotalLine('סה"כ לפני מע"מ:', grandTotal);
    drawTotalLine('סה"כ כולל מע"מ:', grandTotal * 1.18);

    return grandTotal;
}

async function drawExpensesPage(
    pdfDoc: PDFDocument,
    expenses: ExpenseDto[],
    fonts: PdfFonts,
    externalDoc: PDFDocument
): Promise<number> {
    const { hebrewFont, hebrewBoldFont, monoFont } = fonts;
    const textColor = COLORS.FONT_DARK;

    const PAGE_AXIS = { x: LAYOUT.TABLE_X_START, y: 550 };
    const { x, y: startY } = PAGE_AXIS;

    const [templatePage] = await pdfDoc.copyPages(externalDoc, [4]);
    const page = pdfDoc.addPage(templatePage);

    let currentY = startY;
    let totalBeforeVat = 0;
    let totalAfterVat = 0;

    const xPos = {
        name: x,
        beforeVat: x - 330,
        afterVat: x - 460
    };

    const headers = [
        { text: 'סעיף הוצאה', x: xPos.name },
        { text: 'לפני מע"מ', x: xPos.beforeVat },
        { text: 'כולל מע"מ', x: xPos.afterVat }
    ];

    headers.forEach(h => {
        const formatted = bidi(h.text);
        const w = hebrewBoldFont.widthOfTextAtSize(formatted, FONT_SIZES.HEADER);
        page.drawText(formatted, { x: h.x - w, y: currentY, size: FONT_SIZES.HEADER, font: hebrewBoldFont, color: textColor });
    });

    currentY -= 20;
    page.drawLine({ start: { x: LAYOUT.MARGIN_LEFT - 20, y: currentY }, end: { x, y: currentY }, thickness: SPACING.LINE_THICKNESS, color: textColor });
    currentY -= 25;

    const drawCenteredMono = (val: string, posX: number, headerText: string, isBold: boolean = false) => {
        const font = isBold ? hebrewBoldFont : monoFont;
        const formattedVal = bidi(val);
        const formattedHeader = bidi(headerText);
        const textWidth = font.widthOfTextAtSize(formattedVal, FONT_SIZES.BODY);
        const headerWidth = hebrewBoldFont.widthOfTextAtSize(formattedHeader, FONT_SIZES.HEADER);
        const centeredX = (posX - (headerWidth / 2)) - (textWidth / 2);
        page.drawText(formattedVal, { x: centeredX, y: currentY, size: FONT_SIZES.BODY, font, color: textColor });
    };

    expenses.forEach((exp) => {
        const amount = exp.amount || 0;
        const amountAfterVat = exp.vat !== false ? amount * 1.18 : amount;
        totalBeforeVat += amount;
        totalAfterVat += amountAfterVat;

        const displayName = exp.invoice === false ? `${exp.name} - ללא חשבונית` : exp.name;
        const formattedName = bidi(displayName);

        page.drawText(formattedName, {
            x: xPos.name - hebrewFont.widthOfTextAtSize(formattedName, FONT_SIZES.BODY),
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewFont,
            color: textColor
        });

        drawCenteredMono(`${amount.toLocaleString()} ₪`, xPos.beforeVat, 'לפני מע"מ');
        drawCenteredMono(`${Math.round(amountAfterVat).toLocaleString()} ₪`, xPos.afterVat, 'כולל מע"מ');

        currentY -= SPACING.ROW_GAP;
    });

    currentY -= 10;
    page.drawLine({ start: { x: LAYOUT.MARGIN_LEFT - 20, y: currentY }, end: { x, y: currentY }, thickness: SPACING.LINE_THICKNESS, color: textColor });
    currentY -= 25;

    const drawTotalLine = (label: string, value: number) => {
        const formattedLabel = bidi(label);
        page.drawText(formattedLabel, {
            x: xPos.beforeVat - hebrewBoldFont.widthOfTextAtSize(formattedLabel, FONT_SIZES.BODY),
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewBoldFont,
            color: textColor
        });
        drawCenteredMono(`${Math.round(value).toLocaleString()} ₪`, xPos.afterVat, 'כולל מע"מ', true);
        currentY -= 20;
    };

    drawTotalLine('סה"כ לפני מע"מ:', totalBeforeVat);
    drawTotalLine('סה"כ כולל מע"מ:', totalAfterVat);

    return totalAfterVat;
}

async function drawCashierPage(
    pdfDoc: PDFDocument,
    cashiers: CashierDto[],
    fonts: PdfFonts,
    externalDoc: PDFDocument
): Promise<number> {
    const { hebrewFont, hebrewBoldFont, monoFont } = fonts;
    const textColor = COLORS.FONT_LIGHT;

    const PAGE_AXIS = { x: LAYOUT.TABLE_X_START, y: 540 };
    const { x, y: startY } = PAGE_AXIS;

    const [templatePage] = await pdfDoc.copyPages(externalDoc, [5]);
    const page = pdfDoc.addPage(templatePage);

    let currentY = startY;

    const barCashiers = cashiers.filter(c => c.location === 'bar');
    const tableCashiers = cashiers.filter(c => c.location === 'tables');

    const xPos = {
        name: x,
        credit: x - 200,
        cash: x - 350,
        total: x - 480
    };

    const drawCenteredMono = (val: string, posX: number, headerText: string, isBold: boolean = false) => {
        const font = isBold ? hebrewBoldFont : monoFont;
        const formattedVal = bidi(val);
        const formattedHeader = bidi(headerText);
        const textWidth = font.widthOfTextAtSize(formattedVal, FONT_SIZES.BODY);
        const headerWidth = hebrewBoldFont.widthOfTextAtSize(formattedHeader, FONT_SIZES.HEADER);
        const centeredX = (posX - (headerWidth / 2)) - (textWidth / 2);
        page.drawText(formattedVal, { x: centeredX, y: currentY, size: FONT_SIZES.BODY, font, color: textColor });
    };

    const drawTable = (title: string, items: CashierDto[]) => {
        const formattedTitle = bidi(title);
        page.drawText(formattedTitle, {
            x: x - hebrewBoldFont.widthOfTextAtSize(formattedTitle, FONT_SIZES.SUBTITLE),
            y: currentY,
            size: FONT_SIZES.SUBTITLE,
            font: hebrewBoldFont,
            color: textColor
        });
        currentY -= 30;

        const headers = [
            { text: 'מיקום', x: xPos.name },
            { text: 'אשראי', x: xPos.credit },
            { text: 'מזומן', x: xPos.cash },
            { text: 'סה"כ', x: xPos.total }
        ];

        headers.forEach(h => {
            const formatted = bidi(h.text);
            const w = hebrewBoldFont.widthOfTextAtSize(formatted, FONT_SIZES.HEADER);
            page.drawText(formatted, { x: h.x - w, y: currentY, size: FONT_SIZES.HEADER, font: hebrewBoldFont, color: textColor });
        });

        currentY -= 15;
        page.drawLine({ start: { x: LAYOUT.MARGIN_LEFT - 20, y: currentY }, end: { x, y: currentY }, thickness: 1, color: textColor });
        currentY -= 20;

        let subTotal = 0;
        items.forEach((c, index) => {
            const credit = c.credit || 0;
            const cash = c.cash || 0;
            const rowTotal = credit + cash;
            subTotal += rowTotal;
            const label = `${title} ${index + 1}`;
            const formattedLabel = bidi(label);

            page.drawText(formattedLabel, {
                x: xPos.name - hebrewFont.widthOfTextAtSize(formattedLabel, FONT_SIZES.BODY),
                y: currentY,
                size: FONT_SIZES.BODY,
                font: hebrewFont,
                color: textColor
            });

            drawCenteredMono(`${credit.toLocaleString()} ₪`, xPos.credit, 'אשראי');
            drawCenteredMono(`${cash.toLocaleString()} ₪`, xPos.cash, 'מזומן');
            drawCenteredMono(`${rowTotal.toLocaleString()} ₪`, xPos.total, 'סה"כ');
            currentY -= SPACING.ROW_GAP;
        });

        currentY -= 5;
        page.drawLine({ start: { x: LAYOUT.MARGIN_LEFT - 20, y: currentY }, end: { x, y: currentY }, thickness: 1, color: textColor });
        currentY -= 20;

        const subLabel = `סה"כ ${title}:`;
        const formattedSubLabel = bidi(subLabel);
        page.drawText(formattedSubLabel, {
            x: xPos.cash - 20 - hebrewBoldFont.widthOfTextAtSize(formattedSubLabel, FONT_SIZES.BODY),
            y: currentY,
            size: FONT_SIZES.BODY,
            font: hebrewBoldFont,
            color: textColor
        });
        drawCenteredMono(`${subTotal.toLocaleString()} ₪`, xPos.total, 'סה"כ', true);

        currentY -= 40;
        return subTotal;
    };

    const totalBar = drawTable('בר', barCashiers);
    const totalTables = drawTable('שולחנות', tableCashiers);
    const grandTotal = totalBar + totalTables;

    currentY -= 10;
    const totalText = `סה"כ הכנסות אירוע:   ${grandTotal.toLocaleString()} ₪`;
    const formattedTotalText = bidi(totalText);
    page.drawText(formattedTotalText, {
        x: LAYOUT.MARGIN_LEFT - 20,
        y: currentY,
        size: FONT_SIZES.HEADER,
        font: hebrewBoldFont,
        color: textColor
    });

    return grandTotal;
}

async function drawSummaryPage(
    pdfDoc: PDFDocument,
    fonts: PdfFonts,
    externalDoc: PDFDocument,
    totalIncomes: number,
    totalExpenses: number
): Promise<void> {
    const { hebrewBoldFont, monoFont } = fonts;
    const textColor = COLORS.FONT_DARK;

    const [templatePage] = await pdfDoc.copyPages(externalDoc, [6]);
    const page = pdfDoc.addPage(templatePage);

    const xAnchor = LAYOUT.MARGIN_RIGHT;
    const marginLeft = LAYOUT.MARGIN_LEFT;
    let currentY = 500;

    const incomesWithVat = totalIncomes;
    const expensesWithVat = totalExpenses;
    const finalProfit = incomesWithVat - expensesWithVat;

    const drawFinanceRow = (label: string, value: number, y: number, subLabel: string, isBold: boolean = false) => {
        const valText = `${Math.round(value).toLocaleString()} ₪`;
        const fontSize = isBold ? 18 : 16;

        const formattedLabel = bidi(label);
        page.drawText(formattedLabel, {
            x: xAnchor - hebrewBoldFont.widthOfTextAtSize(formattedLabel, fontSize),
            y: y + 5,
            size: fontSize,
            font: hebrewBoldFont,
            color: textColor
        });

        const formattedSubLabel = bidi(subLabel);
        page.drawText(formattedSubLabel, {
            x: xAnchor - hebrewBoldFont.widthOfTextAtSize(formattedSubLabel, 10),
            y: y - 8,
            size: 10,
            font: hebrewBoldFont,
            color: rgb(0.5, 0.5, 0.5)
        });

        const formattedValText = bidi(valText);
        page.drawText(formattedValText, {
            x: marginLeft + 15,
            y: y,
            size: isBold ? 20 : 18,
            font: monoFont,
            color: textColor
        });
    };

    drawFinanceRow('סה"כ הכנסות אירוע', incomesWithVat, currentY, 'כולל מע"מ');
    currentY -= 60;
    drawFinanceRow('סה"כ הוצאות אירוע', expensesWithVat, currentY, 'כולל מע"מ');

    currentY -= 80;

    const profitLabel = finalProfit >= 0 ? 'רווח נקי סופי:' : 'הפסד נקי סופי:';
    drawFinanceRow(profitLabel, finalProfit, currentY, 'נטו לאחר מע"מ', true);
}

export async function generateEventPdf(data: EventReportData): Promise<Buffer> {
    // Initialize PDF engine, register fontkit, load template and fonts
    const pdfDoc = await PDFDocument.create();

    const basePdfBytes = await loadBasePdfFromS3();
    const externalDoc = await PDFDocument.load(basePdfBytes);

    const fonts = await loadFonts(pdfDoc);
    // Render title page using session and client metadata
    await drawGeneralInfoPage(pdfDoc, data.session, data.client, fonts, externalDoc);

    const [secondPage] = await pdfDoc.copyPages(externalDoc, [1]);
    pdfDoc.addPage(secondPage);

    const enrichedConsumes: EnrichedConsume[] = data.consumes.map(c => ({
        consume: c,
        product: data.products.find(p => p.id === c.productId)! // סימן קריאה כי אנחנו מניחים שהמוצר קיים
    }));

    const soda = enrichedConsumes.filter(e =>
        e.product?.type === 'soda' || e.product?.type === 'energy_drink'
    );

    const alcohol = enrichedConsumes.filter(e =>
        e.product?.type === 'alcohol'
    );
    // Calculate soda totals and render Soft Drinks table
    const softDrinksTotal = await drawSoftDrinksPage(pdfDoc, soda, fonts, externalDoc);

    // Calculate alcohol totals and render Alcohol table configuration setting for
    const alcoholTotal = await drawAlcoholPage(pdfDoc, alcohol, fonts, externalDoc);

    // Aggregate drink totals into a dynamic 'Food Cost' expense
    const foodCost: ExpenseDto = {
        id: "e-2",
        sessionId: data.session.id,
        name: "פוד קוסט",
        amount: softDrinksTotal + alcoholTotal,
        desc: "",
        paidBy: ExpensePaidBy.HOUSE,
        vat: true,
        invoice: true,
        timestamp: new Date().toISOString()
    }

    if (!data.expenses) data.expenses = [];
    data.expenses.push(foodCost);

    // Render expenses and calculate final expenditure sum configuration setting for
    const totalExpenses = await drawExpensesPage(pdfDoc, data.expenses, fonts, externalDoc);

    // Process cashier reports to determine total event income
    const totalIncomes = await drawCashierPage(pdfDoc, data.cashiers, fonts, externalDoc);

    // Generate financial summary comparing total income vs expenses
    await drawSummaryPage(pdfDoc, fonts, externalDoc, totalIncomes, totalExpenses);

    // Append final static closing page from template configuration setting for
    const [finalPage] = await pdfDoc.copyPages(externalDoc, [8]);
    pdfDoc.addPage(finalPage);

    return Buffer.from(await pdfDoc.save());
}
