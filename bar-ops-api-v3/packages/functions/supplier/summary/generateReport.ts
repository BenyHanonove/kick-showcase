import { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib';
import { SupplierEventReport, SupplierReportData } from './types';

import { FONT_SIZES, COLORS, SPACING, LAYOUT, loadFonts, bidi, PdfFonts } from '@utils/file-generation/pdf.util';

const MONTHS_HE: Record<number, string> = {
    1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל', 5: 'מאי', 6: 'יוני',
    7: 'יולי', 8: 'אוגוסט', 9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
};

const VAT_RATE = 0.18;

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const TOP_Y = 800;
const BOTTOM_MARGIN = 80;

const X_RIGHT = LAYOUT.TABLE_X_START;       // 570
const X_LEFT = LAYOUT.MARGIN_LEFT - 20;     // 50

const COL = {
    product: X_RIGHT,
    order: X_RIGHT - 150,
    arrived: X_RIGHT - 208,
    returned: X_RIGHT - 266,
    quantity: X_RIGHT - 324,
    price: X_RIGHT - 382,
    total: X_RIGHT - 440,
};

interface Cursor {
    page: PDFPage;
    y: number;
}

const drawRTL = (
    page: PDFPage,
    text: string,
    xRight: number,
    y: number,
    size: number,
    font: PDFFont,
    color: RGB,
) => {
    const formatted = bidi(text);
    page.drawText(formatted, { x: xRight - font.widthOfTextAtSize(formatted, size), y, size, font, color });
};

const money = (n: number) => `${n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;

const drawTableHeader = (page: PDFPage, y: number, fonts: PdfFonts, color: RGB): number => {
    const { hebrewBoldFont } = fonts;
    const headers = [
        { text: 'מוצר', x: COL.product },
        { text: 'הוזמן', x: COL.order },
        { text: 'הגיע', x: COL.arrived },
        { text: 'הוחזר', x: COL.returned },
        { text: 'כמות', x: COL.quantity },
        { text: 'מחיר ספק', x: COL.price },
        { text: 'סה"כ', x: COL.total },
    ];
    headers.forEach(h => drawRTL(page, h.text, h.x, y, FONT_SIZES.HEADER, hebrewBoldFont, color));

    y -= 15;
    page.drawLine({
        start: { x: X_LEFT, y },
        end: { x: X_RIGHT, y },
        thickness: 1,
        color,
    });
    return y - 22;
};

function drawEventTable(pdfDoc: PDFDocument, cursor: Cursor, ev: SupplierEventReport, fonts: PdfFonts): number {
    const { hebrewFont, hebrewBoldFont, monoFont } = fonts;
    const color = COLORS.FONT_DARK;

    const newPage = () => {
        cursor.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        cursor.y = TOP_Y;
    };

    if (cursor.y < BOTTOM_MARGIN + 110) newPage();

    // Event heading: name + date (session or sale)
    const dateStr = new Date(ev.event.datetime).toLocaleDateString('he-IL');
    const heading = `אירוע: ${ev.event.name} - ${dateStr}`;
    drawRTL(cursor.page, heading, X_RIGHT, cursor.y, FONT_SIZES.SUBTITLE, hebrewBoldFont, color);
    cursor.y -= 28;

    cursor.y = drawTableHeader(cursor.page, cursor.y, fonts, color);

    let eventTotal = 0;
    ev.consumes.forEach(consume => {
        if (cursor.y < BOTTOM_MARGIN) {
            newPage();
            cursor.y = drawTableHeader(cursor.page, cursor.y, fonts, color);
        }

        const order = consume.order || 0;
        const arrived = consume.arrived || 0;
        const returned = consume.creditedToSupplier || 0;
        const quantity = arrived - returned;
        const supplierPrice = consume.supplierPrice || 0;
        const total = quantity * supplierPrice;
        eventTotal += total;

        const name = (consume.name || '').split('(')[0].trim();
        drawRTL(cursor.page, name, COL.product, cursor.y, FONT_SIZES.BODY, hebrewFont, color);
        drawRTL(cursor.page, String(order), COL.order, cursor.y, FONT_SIZES.BODY, monoFont, color);
        drawRTL(cursor.page, String(arrived), COL.arrived, cursor.y, FONT_SIZES.BODY, monoFont, color);
        drawRTL(cursor.page, String(returned), COL.returned, cursor.y, FONT_SIZES.BODY, monoFont, color);
        drawRTL(cursor.page, String(quantity), COL.quantity, cursor.y, FONT_SIZES.BODY, monoFont, color);
        drawRTL(cursor.page, money(supplierPrice), COL.price, cursor.y, FONT_SIZES.BODY, monoFont, color);
        drawRTL(cursor.page, money(total), COL.total, cursor.y, FONT_SIZES.BODY, monoFont, color);

        cursor.y -= SPACING.ROW_GAP;
    });

    cursor.y -= 4;
    cursor.page.drawLine({
        start: { x: X_LEFT, y: cursor.y },
        end: { x: X_RIGHT, y: cursor.y },
        thickness: 1,
        color,
    });
    cursor.y -= 20;

    drawRTL(cursor.page, 'סה"כ לאירוע:', COL.quantity, cursor.y, FONT_SIZES.BODY, hebrewBoldFont, color);
    drawRTL(cursor.page, money(eventTotal), COL.total, cursor.y, FONT_SIZES.BODY, hebrewBoldFont, color);
    cursor.y -= 20;
    drawRTL(cursor.page, 'כולל מע"מ 18%', COL.quantity, cursor.y, FONT_SIZES.BODY, hebrewBoldFont, color);
    drawRTL(cursor.page, money(eventTotal * 1.18), COL.total, cursor.y, FONT_SIZES.BODY, hebrewBoldFont, color);

    cursor.y -= 35;

    return eventTotal;
}

function drawGrandSummary(pdfDoc: PDFDocument, cursor: Cursor, grandTotal: number, fonts: PdfFonts) {
    const { hebrewBoldFont, monoFont } = fonts;
    const color = COLORS.FONT_DARK;

    if (cursor.y < BOTTOM_MARGIN + 130) {
        cursor.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        cursor.y = TOP_Y;
    }

    cursor.page.drawLine({
        start: { x: X_LEFT, y: cursor.y },
        end: { x: X_RIGHT, y: cursor.y },
        thickness: SPACING.LINE_THICKNESS,
        color,
    });
    cursor.y -= 32;

    const vat = grandTotal * VAT_RATE;
    const totalWithVat = grandTotal + vat;

    const row = (label: string, value: number, bold = false) => {
        const size = bold ? FONT_SIZES.HEADER + 4 : FONT_SIZES.HEADER;
        drawRTL(cursor.page, label, X_RIGHT, cursor.y, size, hebrewBoldFont, color);
        cursor.page.drawText(money(value), {
            x: X_LEFT,
            y: cursor.y,
            size,
            font: bold ? hebrewBoldFont : monoFont,
            color,
        });
        cursor.y -= bold ? 38 : 30;
    };

    row('סה"כ כל האירועים לפני מע"מ:', grandTotal);
    row('מע"מ 18%:', vat);
    row('סה"כ סופי כולל מע"מ:', totalWithVat, true);
}

export async function generateSupplierPdf(data: SupplierReportData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    const fonts = await loadFonts(pdfDoc);
    const color = COLORS.FONT_DARK;

    const cursor: Cursor = {
        page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
        y: TOP_Y,
    };

    const [year, month] = data.monthYear.split('-').map(Number);
    const titleText = `סיכום חודש ${MONTHS_HE[month]} ${year}`;
    drawRTL(cursor.page, titleText, X_RIGHT, cursor.y, FONT_SIZES.TITLE, fonts.hebrewBoldFont, color);
    cursor.y -= 36;

    drawRTL(cursor.page, data.supplier.name, X_RIGHT, cursor.y, FONT_SIZES.SUBTITLE, fonts.hebrewBoldFont, color);
    cursor.y -= 55;

    let grandTotal = 0;
    for (const ev of data.events) {
        grandTotal += drawEventTable(pdfDoc, cursor, ev, fonts);
    }

    drawGrandSummary(pdfDoc, cursor, grandTotal, fonts);

    return Buffer.from(await pdfDoc.save());
}