// Import external framework dependencies and status codes from third party packages
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import { EnrichedConsume, SaleReportData } from './types';

// Import shared AWS services, guard security middleware, and utility helpers
import { loadFonts, loadBasePdfFromS3, bidi } from '@utils/file-generation/pdf.util';

const Y_OFFSET = 100;

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

export async function generateSalePdf(data: SaleReportData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const fonts = await loadFonts(pdfDoc);
    const { hebrewFont, hebrewBoldFont, monoFont } = fonts;

    const PRIMARY_COLOR = rgb(0.12, 0.16, 0.27); // Dark navy slate
    const TEXT_COLOR = rgb(0.18, 0.22, 0.33); // Slate gray for body
    const ACCENT_COLOR = rgb(0.38, 0.44, 0.6); // Muted steel blue
    const BORDER_COLOR = rgb(0.85, 0.87, 0.9); // Light gray for dividers

    const basePdfBytes = await loadBasePdfFromS3();
    const externalDoc = await PDFDocument.load(basePdfBytes);
    const [templatePage] = await pdfDoc.copyPages(externalDoc, [0]);
    const page = pdfDoc.addPage(templatePage);

    const drawTextRight = (text: string, x: number, y: number, font: PDFFont, size: number, color = TEXT_COLOR) => {
        const formatted = bidi(text);
        const width = font.widthOfTextAtSize(formatted, size);
        page.drawText(formatted, {
            x: x - width,
            y,
            size,
            font,
            color
        });
    };

    const titleText = 'דוח סיכום מכירה';
    drawTextRight(titleText, 545, 770 - Y_OFFSET, hebrewBoldFont, 22, PRIMARY_COLOR);

    const saleName = data.sale.name;
    drawTextRight(saleName, 545, 745 - Y_OFFSET, hebrewBoldFont, 12, ACCENT_COLOR);

    const dateObj = new Date(data.sale.datetime);
    const day = dateObj.getUTCDate();
    const month = dateObj.getUTCMonth() + 1;
    const year = dateObj.getUTCFullYear();
    const monthNameHe = MONTHS_HE[month];
    const dateLine = `תאריך: ${day} ${monthNameHe} ${year}`;

    drawTextRight(dateLine, 525, 695 - Y_OFFSET, hebrewFont, 8);

    const clientBrand = `לקוח: ${data.client.brand}`;
    const clientContact = `איש קשר: ${data.client.name}`;
    const rawPhone = (data.client.phone || '').replace(/-/g, '');
    const formattedPhone = rawPhone.length > 3 ? `${rawPhone.slice(0, 3)}-${rawPhone.slice(3)}` : rawPhone;
    const clientPhone = `טלפון: ${formattedPhone}`;

    drawTextRight(clientBrand, 320, 695 - Y_OFFSET, hebrewBoldFont, 8, PRIMARY_COLOR);
    drawTextRight(clientContact, 320, 675 - Y_OFFSET, hebrewFont, 8);
    drawTextRight(clientPhone, 320, 655 - Y_OFFSET, hebrewFont, 8);

    let currentY = 590 - Y_OFFSET;

    drawTextRight('מוצר', 525, currentY, hebrewBoldFont, 9, PRIMARY_COLOR);
    drawTextRight('מחיר יחידה', 395, currentY, hebrewBoldFont, 9, PRIMARY_COLOR);
    drawTextRight('מחיר יחידה כולל מע"מ', 300, currentY, hebrewBoldFont, 9, PRIMARY_COLOR);
    drawTextRight('כמות', 190, currentY, hebrewBoldFont, 9, PRIMARY_COLOR);
    drawTextRight('סה"כ', 110, currentY, hebrewBoldFont, 9, PRIMARY_COLOR);

    currentY -= 8;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x: 545, y: currentY }, thickness: 1, color: BORDER_COLOR });

    currentY -= 20;

    const enrichedConsumes: EnrichedConsume[] = data.consumes.map(c => ({
        consume: c,
        product: data.products.find(p => p.id === c.productId)!
    })).filter(ec => ec.product); // Ensure product exists

    let totalBeforeVat = 0;

    enrichedConsumes.forEach(({ consume, product }) => {
        const consumed = (consume.arrived || 0) + (consume.fromStorage || 0) - (consume.creditedToSupplier || 0);
        if (consumed <= 0) return; // Skip items with no consumption

        const unitPrice = consume.chargedPrice || 0;
        const unitPriceWithVat = unitPrice * 1.18;
        const rowTotal = unitPrice * consumed;
        totalBeforeVat += rowTotal;

        const productName = product.name.split('(')[0].trim();
        const priceText = `${unitPrice} ₪`;
        const priceWithVatText = `${unitPriceWithVat.toFixed(2)} ₪`;
        const qtyText = consumed.toString();
        const totalText = `${rowTotal.toFixed(2)} ₪`;

        drawTextRight(productName, 525, currentY, hebrewFont, 8);
        drawTextRight(priceText, 395, currentY, monoFont, 8);
        drawTextRight(priceWithVatText, 300, currentY, monoFont, 8);
        drawTextRight(qtyText, 190, currentY, monoFont, 8);
        drawTextRight(totalText, 110, currentY, monoFont, 8);

        currentY -= 22;

        page.drawLine({ start: { x: 50, y: currentY + 10 }, end: { x: 545, y: currentY + 10 }, thickness: 0.5, color: BORDER_COLOR });
    });

    currentY -= 15;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x: 545, y: currentY }, thickness: 1.5, color: PRIMARY_COLOR });

    currentY -= 25;

    const vatAmount = totalBeforeVat * 0.18;
    const grandTotal = totalBeforeVat * 1.18;

    drawTextRight('סה"כ לפני מע"מ:', 230, currentY, hebrewFont, 8);
    drawTextRight(`${Math.round(totalBeforeVat)} ₪`, 110, currentY, monoFont, 8);

    currentY -= 20;

    drawTextRight(`כולל מע"מ 18%:`, 230, currentY, hebrewFont, 8);
    drawTextRight(`${Math.round(vatAmount)} ₪`, 110, currentY, monoFont, 8);

    currentY -= 25;
    page.drawLine({ start: { x: 50, y: currentY + 15 }, end: { x: 545, y: currentY + 15 }, thickness: 0.5, color: BORDER_COLOR });

    drawTextRight('סה"כ כולל מע"מ:', 230, currentY, hebrewBoldFont, 10, PRIMARY_COLOR);
    drawTextRight(`${Math.round(grandTotal)} ₪`, 110, currentY, monoFont, 10, PRIMARY_COLOR);

    return Buffer.from(await pdfDoc.save());
}
