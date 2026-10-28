import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { docClient } from "./client.dynamo";
import { type DynamoItem, type DateSplitKeys, splitDatetime, recombineDatetime, stripStorageOnlyFields } from "./item.dynamo";
import { invalidateTable } from "./create.dynamo";

import { contextStorage } from '@guards/role.guard';

export class ConcurrencyConflictError extends Error {
    constructor(message: string = "Concurrency conflict: the resource has been modified by another process.") {
        super(message);
        this.name = "ConcurrencyConflictError";
    }
}

export interface UpdateInput {
    TableName: string;
    Key: { id: string };
    UpdateExpression: string;
    ConditionExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: DynamoItem;
}

// Build the conditional SET for a partial update. Strips id/timestamp/undefined from the
// body, writes a fresh timestamp and lastEditor, and, when the client sent the timestamp
// it last saw, makes the write conditional on it (optimistic locking).
// Exposed so TransactWrite callers get exactly the same semantics as update().
export const buildUpdateInput = <U extends object>(
    tableName: string,
    id: string,
    body: U,
    dateSplitKeys?: DateSplitKeys
): UpdateInput => {
    const filteredBody = Object.fromEntries(
        Object.entries(body).filter(([key, val]) => val !== undefined && key !== 'id' && key !== 'timestamp')
    ) as DynamoItem;

    filteredBody.timestamp = new Date().toISOString();

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

    let conditionExpression = "attribute_exists(id)";

    const expectedTimestamp = (body as { timestamp?: unknown }).timestamp;
    if (typeof expectedTimestamp === 'string') {
        conditionExpression += " AND (attribute_not_exists(#ts) OR #ts = :expectedTimestamp)";
        expressionAttributeNames["#ts"] = "timestamp";
        expressionAttributeValues[":expectedTimestamp"] = expectedTimestamp;
    }

    return {
        TableName: tableName,
        Key: { id },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ConditionExpression: conditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    };
};

// After a failed condition, tell "row is gone" (null -> 404) from "row changed" (409)
export const resolveConditionFailure = async (tableName: string, id: string): Promise<null> => {
    const { Item: existingItem } = await docClient.send(new GetCommand({
        TableName: tableName,
        Key: { id },
        ConsistentRead: true,
    }));

    if (!existingItem) {
        return null;
    }
    throw new ConcurrencyConflictError();
};

// Turn a stored item into the validated API DTO (date recombined, audit fields dropped)
export const hydrate = async <T extends object>(
    item: DynamoItem,
    dto: ClassConstructor<T>,
    dateSplitKeys?: DateSplitKeys
): Promise<T> => {
    const mergedData = stripStorageOnlyFields(recombineDatetime(item, dateSplitKeys));

    const instance = plainToInstance(dto, mergedData, {
        enableImplicitConversion: true,
    });

    const errors = await validate(instance, { whitelist: true });
    if (errors.length > 0) {
        throw errors;
    }

    return instance;
};

// Update item in DynamoDB table
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

    let response;
    try {
        response = await docClient.send(new UpdateCommand({
            ...buildUpdateInput(tableName, id, body, dateSplitKeys),
            ReturnValues: "ALL_NEW",
        }));
    } catch (err: unknown) {
        if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
            return resolveConditionFailure(tableName, id);
        }
        throw err;
    }

    const returnedItem = response.Attributes;
    if (!returnedItem) {
        return null;
    }

    const instance = await hydrate(returnedItem as DynamoItem, dto, dateSplitKeys);

    await invalidateTable(tableName);

    return instance;
};
