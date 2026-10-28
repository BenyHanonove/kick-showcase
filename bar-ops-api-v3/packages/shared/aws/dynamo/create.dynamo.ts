// Import external framework dependencies and status codes from third party packages
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "./client.dynamo";
import { type DynamoItem, type DateSplitKeys, splitDatetime } from "./item.dynamo";

// Import shared AWS services, guard security middleware, and utility helpers
import { redisClient, CACHE_TTL_SECONDS } from "@aws/redis/client.redis";
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

    // Instantiate combined body and identifier with timestamp configuration setting for
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

    // Retrieve active request editor identity (Cognito sub) configuration setting for
    const editorId = contextStorage.getStore()?.editorId;
    const finalItem: DynamoItem = { ...itemToSave, timestamp };
    if (editorId) {
        finalItem.lastEditor = editorId;
    }

    await docClient.send(new PutCommand({
        TableName: tableName,
        Item: finalItem,
    }));

    // Bump table version first, then cache the new item
    try {
        const version = await redisClient.incr(`version:${tableName}`);
        const cacheKey = `get:${tableName}:${version}:${id}`;
        await redisClient.set(cacheKey, JSON.stringify(instance), "EX", CACHE_TTL_SECONDS); // hard TTL
    } catch {
        // Cache priming is best-effort; readers fall back to DynamoDB
    }

    return instance;
};
