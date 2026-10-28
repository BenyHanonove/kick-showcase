import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "./client.dynamo";
import { type DynamoItem, type DateSplitKeys, splitDatetime } from "./item.dynamo";

import { redisClient } from "@aws/redis/client.redis";
import { contextStorage } from '@guards/role.guard';

export interface PreparedCreate<T> {
    // Validated DTO returned to the caller (no storage-only fields)
    instance: T;
    // Exact item to write, for callers that put it inside a TransactWrite
    item: DynamoItem;
}

// Validate and shape a new item without writing it. Throws ValidationError[] on bad input.
export const prepareCreate = async <T extends object, U extends object = Partial<T>>(
    body: U | null,
    dto: ClassConstructor<T>,
    dateSplitKeys?: DateSplitKeys
): Promise<PreparedCreate<T>> => {
    if (!body) {
        throw new Error("Body is required");
    }

    const id = (body as Record<string, string>).id || uuidv4();

    const timestamp = new Date().toISOString();

    const instance = plainToInstance(dto, { ...body, id, timestamp }, {
        enableImplicitConversion: true,
    });

    const errors = await validate(instance);
    if (errors.length > 0) {
        throw errors;
    }

    // Materialize storage-only partition fields (monthYear/day); the returned `instance`
    // never sees them, so they can't leak into the API response
    const itemToSave = splitDatetime({ ...instance } as DynamoItem, dateSplitKeys);

    // Audit trail: the Cognito sub RolesGuard put in the request context
    const editorId = contextStorage.getStore()?.editorId;
    const item: DynamoItem = { ...itemToSave, timestamp };
    if (editorId) {
        item.lastEditor = editorId;
    }

    return { instance, item };
};

// Bump the table's cache version so every cached get/list for it is orphaned.
// Writers only invalidate, they never prime: the order of two INCRs says nothing
// about the order of the DynamoDB writes behind them, so priming could pin an older
// copy under the newest version. Readers repopulate on the next get/list.
export const invalidateTable = async (tableName: string): Promise<void> => {
    try {
        await redisClient.incr(`version:${tableName}`);
    } catch {
        // Invalidation is best-effort; versioned cache keys expire via TTL
    }
};

export const create = async <T extends object, U extends object = Partial<T>>(
    tableName: string,
    body: U | null,
    dto: ClassConstructor<T>,
    dateSplitKeys?: DateSplitKeys
): Promise<T> => {
    if (!tableName) {
        throw new Error("Table name is required");
    }

    const { instance, item } = await prepareCreate(body, dto, dateSplitKeys);

    await docClient.send(new PutCommand({
        TableName: tableName,
        Item: item,
    }));

    await invalidateTable(tableName);

    return instance;
};
