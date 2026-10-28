import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "./client.dynamo";
import { type DynamoItem, type DateSplitKeys, splitDatetime } from "./item.dynamo";

import { redisClient } from "@aws/redis/client.redis";
import { contextStorage } from '@guards/role.guard';

export const create = async <T extends object, U extends object = Partial<T>>(
    tableName: string,
    body: U | null,
    dto: ClassConstructor<T>,
    dateSplitKeys?: DateSplitKeys
): Promise<T> => {
    if (!tableName) {
        throw new Error("Table name is required");
    }

    if (!body) {
        throw new Error("Body is required");
    }

    const id = (body as Record<string, string>).id || uuidv4();

    const timestamp = new Date().toISOString();

    // Instantiate combined body and identifier with timestamp
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

    // Retrieve active request editor identity (Cognito sub)
    const editorId = contextStorage.getStore()?.editorId;
    const finalItem: DynamoItem = { ...itemToSave, timestamp };
    if (editorId) {
        finalItem.lastEditor = editorId;
    }

    await docClient.send(new PutCommand({
        TableName: tableName,
        Item: finalItem,
    }));

    // Writers only invalidate, they never prime: the order of two INCRs says nothing
    // about the order of the DynamoDB writes behind them, so priming could pin an older
    // copy under the newest version. Readers repopulate on the next get/list.
    try {
        await redisClient.incr(`version:${tableName}`);
    } catch {
        // Invalidation is best-effort; versioned cache keys expire via TTL
    }

    return instance;
};
