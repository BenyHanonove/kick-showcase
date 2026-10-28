export class ResourceMessages<
    S extends Record<string, string> = Record<string, never>,
    E extends Record<string, string> = Record<string, never>
> {
    public readonly SUCCESS: {
        readonly CREATED: string;
        readonly UPDATED: string;
        readonly DELETED: string;
        readonly LOADED: string;
        readonly LIST_LOADED: string;
        readonly RECEIPT_UPLOADED: string;
        readonly RECEIPT_DELETED: string;
    } & S;
    public readonly ERROR: {
        readonly NOT_FOUND: string;
        readonly ALREADY_EXISTS: string;
        readonly MISSING_ID: string;
        readonly INVALID_ID: string;
        readonly INTERNAL_SERVER_ERROR: string;
        readonly VALIDATION_FAILED: string;
        readonly CREDENTIALS_ALREADY_EXISTS: string;
        readonly MISSING_PARAMS: string;
        readonly CONCURRENCY_CONFLICT: string;
    } & E;

    // Initialize with singular and plural Hebrew nouns. configuration setting for
    constructor(
        single: string,
        many: string,
        overrides?: { SUCCESS?: S; ERROR?: E }
    ) {
        const gender = (single.endsWith("ה") || single.endsWith("ת")) ? "f" : "m";

        const created = gender === "f" ? `${single} נוצרה בהצלחה` : `${single} נוצר בהצלחה`;
        const updated = gender === "f" ? `${single} עודכנה בהצלחה` : `${single} עודכן בהצלחה`;
        const deleted = gender === "f" ? `${single} נמחקה בהצלחה` : `${single} נמחק בהצלחה`;
        const loaded = `נתוני ${single} נטענו בהצלחה`;
        const listLoaded = `רשימת ${many} נטענה בהצלחה`;
        const receiptUploaded = 'קבלה הועלתה בהצלחה';
        const receiptDeleted = 'קבלה נמחקה בהצלחה';

        const notFound = gender === "f" ? `${single} לא נמצאה` : `${single} לא נמצא`;
        const alreadyExists = gender === "f" ? `${single} כבר קיימת במערכת` : `${single} כבר קיים במערכת`;
        const missingId = `מזהה ${single} חסר`;
        const invalidId = `מזהה ${single} אינו תקין`;
        const internalServerError = 'שגיאה פנימית בשרת';
        const validationFailed = 'שגיאת ולידציה';
        const credentialsAlreadyExists = 'הפרטים שהזנת כבר קיימים';
        const missingParams = 'חסרים פרמטרים חובה בבקשה';
        const concurrencyConflict = 'שגיאת סינכרון: הרשומה עודכנה על ידי משתמש אחר. אנא טען מחדש ונסה שוב.';

        this.SUCCESS = {
            CREATED: created,
            UPDATED: updated,
            DELETED: deleted,
            LOADED: loaded,
            LIST_LOADED: listLoaded,
            RECEIPT_UPLOADED: receiptUploaded,
            RECEIPT_DELETED: receiptDeleted,
            ...(overrides?.SUCCESS || {}),
        } as {
            readonly CREATED: string;
            readonly UPDATED: string;
            readonly DELETED: string;
            readonly LOADED: string;
            readonly LIST_LOADED: string;
            readonly RECEIPT_UPLOADED: string;
            readonly RECEIPT_DELETED: string;
        } & S;

        this.ERROR = {
            NOT_FOUND: notFound,
            ALREADY_EXISTS: alreadyExists,
            MISSING_ID: missingId,
            INVALID_ID: invalidId,
            INTERNAL_SERVER_ERROR: internalServerError,
            VALIDATION_FAILED: validationFailed,
            CREDENTIALS_ALREADY_EXISTS: credentialsAlreadyExists,
            MISSING_PARAMS: missingParams,
            CONCURRENCY_CONFLICT: concurrencyConflict,
            ...(overrides?.ERROR || {}),
        } as {
            readonly NOT_FOUND: string;
            readonly ALREADY_EXISTS: string;
            readonly MISSING_ID: string;
            readonly INVALID_ID: string;
            readonly INTERNAL_SERVER_ERROR: string;
            readonly VALIDATION_FAILED: string;
            readonly CREDENTIALS_ALREADY_EXISTS: string;
            readonly MISSING_PARAMS: string;
            readonly CONCURRENCY_CONFLICT: string;
        } & E;
    }
}
