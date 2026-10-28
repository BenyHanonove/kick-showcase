// Import external framework dependencies and status codes from third party packages
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { docClient } from "./client.dynamo";
import { type DynamoItem, type DateSplitKeys, splitDatetime, recombineDatetime } from "./item.dynamo";

// Import shared AWS services, guard security middleware, and utility helpers
import { redisClient, CACHE_TTL_SECONDS } from "@aws/redis/client.redis";
import { contextStorage } from '@guards/role.guard';

export class ConcurrencyConflictError extends Error {
    constructor(message: string = "Concurrency conflict: the resource has been modified by another process.") {
        super(message);
        this.name = "ConcurrencyConflictError";
    }
}

// Update item in DynamoDB table definition for application business logic
export const update = async <T extends object, U extends object = Partial<T>>(
    tableName: string,
    id: string,
    body: U | null,
    dto: ClassConstructor<T>,
    dateSplitKeys?: DateSplitKeys
): Promise<T | null> => {
    if (!tableName) {
        throw new Error("Table name is required");
    }

    if (!id) {
        throw new Error("ID is required");
    }

    if (!body) {
        throw new Error("Body is required");
    }

    // Filter undefined properties, id, timestamp from update body
    const filteredBody = Object.fromEntries(
        Object.entries(body || {}).filter(([key, val]) => val !== undefined && key !== 'id' && key !== 'timestamp')
    ) as DynamoItem;

    const updatedTimestamp = new Date().toISOString();
    filteredBody.timestamp = updatedTimestamp;

    // Retrieve active request editor identity (Cognito sub) configuration setting for
    const editorId = contextStorage.getStore()?.editorId;
    if (editorId) {
        filteredBody.lastEditor = editorId;
    }

    // Split datetime into monthYear/day if this resource carries one (session/sale)
    const cleanBody = splitDatetime(filteredBody, dateSplitKeys);

    const updateParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: DynamoItem = {};

    Object.entries(cleanBody).forEach(([key, val], idx) => {
        const attributeName = `#k${idx}`;
        const attributeValue = `:v${idx}`;
        updateParts.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = val;
    });

    const updateExpression = `SET ${updateParts.join(', ')}`;
    let conditionExpression = "attribute_exists(id)";

    if (body && 'timestamp' in body) {
        const bodyWithTimestamp = body as { timestamp: string };
        if (typeof bodyWithTimestamp.timestamp === 'string') {
            conditionExpression += " AND (attribute_not_exists(#ts) OR #ts = :expectedTimestamp)";
            expressionAttributeNames["#ts"] = "timestamp";
            expressionAttributeValues[":expectedTimestamp"] = bodyWithTimestamp.timestamp;
        }
    }

    let response;
    try {
        response = await docClient.send(new UpdateCommand({
            TableName: tableName,
            Key: { id },
            UpdateExpression: updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        }));
    } catch (err: unknown) {
        if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
            // Fetch item to distinguish missing resource from timestamp conflict
            const { Item: existingItem } = await docClient.send(new GetCommand({
                TableName: tableName,
                Key: { id },
            }));

            if (!existingItem) {
                return null;
            }
            throw new ConcurrencyConflictError();
        }
        throw err;
    }

    const returnedItem = response.Attributes;
    if (!returnedItem) {
        return null;
    }

    const mergedData = recombineDatetime(returnedItem as DynamoItem, dateSplitKeys);

    const instance = plainToInstance(dto, mergedData, {
        enableImplicitConversion: true,
    });

    const errors = await validate(instance, { whitelist: true });
    if (errors.length > 0) {
        throw errors;
    }

    // Bump table version first, then cache the updated item
    try {
        const version = await redisClient.incr(`version:${tableName}`);
        const cacheKey = `get:${tableName}:${version}:${id}`;
        await redisClient.set(cacheKey, JSON.stringify(instance), "EX", CACHE_TTL_SECONDS); // hard TTL
    } catch {
        // Cache priming is best-effort; readers fall back to DynamoDB
    }

    // Ensure lastEditor is not returned to the API response
    if (instance) {
        const instanceWithEditor = instance as T & { lastEditor?: string };
        if (instanceWithEditor.lastEditor !== undefined) {
            delete instanceWithEditor.lastEditor;
        }
    }

    return instance;
};
