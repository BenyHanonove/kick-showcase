import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";

// Per-item outcome of a cancelled TransactWriteItems, in the same order as the request.
// DynamoDB codes: "None" (item was fine), "ConditionalCheckFailed", "TransactionConflict"
// (another transaction/write touched the item concurrently), "ThrottlingError", etc.
export type CancellationCode = string | undefined;

export const isTransactionCanceled = (err: unknown): err is TransactionCanceledException =>
    err instanceof Error && err.name === "TransactionCanceledException";

export const cancellationCodes = (err: TransactionCanceledException): CancellationCode[] =>
    (err.CancellationReasons ?? []).map((reason) => reason.Code);
