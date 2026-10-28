import { rgb, PDFDocument, PDFFont } from 'pdf-lib';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import fontkit from '@pdf-lib/fontkit';

import { s3Client } from '@aws/s3/client.s3';

export const COLORS = {
    FONT_LIGHT: rgb(1, 1, 1),
    FONT_DARK: rgb(0, 0, 0),
};

// Font size constants for document layout generation and rendering
export const FONT_SIZES = {
    TITLE: 25,
    SUBTITLE: 22,
    HEADER: 12,
    BODY: 10,
    SMALL: 8,
};

// Spacing constants for document layout generation and rendering
export const SPACING = {
    TITLE_GAP: 34,
    ROW_GAP: 24,
    LINE_THICKNESS: 2,
};

// Page layout constants for document layout generation and rendering
export const LAYOUT = {
    MARGIN_LEFT: 70,
    MARGIN_RIGHT: 530,
    CARD_WIDTH: 460,
    TABLE_X_START: 570
};

// Font type definitions for document layout generation and rendering
export interface PdfFonts {
    hebrewFont: PDFFont;
    hebrewBoldFont: PDFFont;
    monoFont: PDFFont;
}

async function fetchFont(bucket: string, key: string): Promise<Uint8Array> {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return await res.Body!.transformToByteArray();
}

// Load and embed Hebrew fonts into PDF for document layout
export async function loadFonts(pdfDoc: PDFDocument): Promise<PdfFonts> {
    pdfDoc.registerFontkit(fontkit);

    const bucket = process.env.GLOBAL_BUCKET!;
    const prefix = process.env.FONTS_PREFIX || 'fonts';
    const keyFor = (family: string, name: string) =>
        `${prefix}/${family}/static/${name}.ttf`;

    const [hebrewBytes, hebrewBoldBytes, monoBytes] = await Promise.all([
        fetchFont(bucket, keyFor('Noto_Sans_Hebrew', 'NotoSansHebrew-Regular')),
        fetchFont(bucket, keyFor('Noto_Sans_Hebrew', 'NotoSansHebrew-Bold')),
        fetchFont(bucket, keyFor('Noto_Sans_Mono', 'NotoSansMono-Regular')),
    ]);

    const [hebrewFont, hebrewBoldFont, monoFont] = await Promise.all([
        pdfDoc.embedFont(hebrewBytes),
        pdfDoc.embedFont(hebrewBoldBytes),
        pdfDoc.embedFont(monoBytes),
    ]);

    return { hebrewFont, hebrewBoldFont, monoFont };
}

// Load base PDF template from S3 for document layout generation
export async function loadBasePdfFromS3(): Promise<Uint8Array> {
    const bucket = process.env.GLOBAL_BUCKET!;
    const key = process.env.PDF_TEMPLATE_KEY || 'pdf/base.pdf';
    const res = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return await res.Body!.transformToByteArray();
}

const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFBFB]/;

// LTR token: english/number kept in reading order for document layout
const isLtrToken = (t: string) => /[a-zA-Z0-9]/.test(t) && !HEBREW_RE.test(t);
const isSpace = (t: string) => /^\s+$/.test(t);

const MIRRORS: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{' };

// Bidi formatter: pre-reverses so fontkit's Hebrew reversal renders correctly
export function bidi(text: string): string {
    if (!text) return "";

    // No Hebrew — pure LTR, return as is
    if (!HEBREW_RE.test(text)) return text;

    // Match Hebrew words, glued LTR tokens, whitespace, punctuation
    const tokenRegex = /([\u0590-\u05FF\uFB1D-\uFBFB״׳"']+|[+₪$]?[a-zA-Z0-9]+(?:[.,:\/\-][a-zA-Z0-9]+)*[%₪$]?|\s+|[^\s\u0590-\u05FF\uFB1D-\uFBFB])/g;
    const tokens = text.match(tokenRegex) || [text];

    // Reverse token order to build the RTL flow
    const reversed = tokens.reverse();

    let i = 0;
    while (i < reversed.length) {
        if (!isLtrToken(reversed[i])) { i++; continue; }
        let last = i;
        let j = i + 1;
        while (j < reversed.length && (isLtrToken(reversed[j]) || isSpace(reversed[j]))) {
            if (isLtrToken(reversed[j])) last = j;
            j++;
        }
        if (last > i) {
            const run = reversed.slice(i, last + 1).reverse();
            reversed.splice(i, run.length, ...run);
        }
        i = last + 1;
    }

    const visual = reversed.map((token) => {
        // Reverse Hebrew letters to build the visual RTL flow
        if (HEBREW_RE.test(token)) return token.split("").reverse().join("");
        return MIRRORS[token] ?? token;
    }).join("");

    // Mirror flow since fontkit reverses it when painting
    return visual.split("").reverse().join("");
}
