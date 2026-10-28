import { DeleteCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client.dynamo";
import { queryAll } from "./paginate.dynamo";

import { redisClient } from "@aws/redis/client.redis";
import { logger } from '@utils/logger/logger.util';

export const remove = async (
    tableName: string,
    id: string
): Promise<boolean> => {
    if (!tableName) {
        throw new Error("Table name is required");
    }
    if (!id) {
        throw new Error("ID is required");
    }

    const result = await docClient.send(
        new DeleteCommand({
            TableName: tableName,
            Key: { id },
            ReturnValues: "ALL_OLD",
        })
    );

    // Invalidate cached reads by bumping the table version
    try {
        await redisClient.incr(`version:${tableName}`);
    } catch {
        // Invalidation is best-effort; versioned cache keys expire via TTL
    }

    return !!result.Attributes;
};

// Delete every row whose GSI field matches (cascade from a parent). `keyName` is the
// table's partition key: "id" for entity tables, "token" for the link-token tables.
export const cascadeDeleteByField = async (
    tableName: string,
    indexName: string,
    fieldName: string,
    fieldValue: string,
    keyName: string = "id"
): Promise<number> => {
    // Paginate so a parent with more than 1MB of children is fully cleaned up
    const items = await queryAll({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: `${fieldName} = :val`,
        ExpressionAttributeValues: { ":val": fieldValue },
    });
    if (items.length === 0) return 0;

    const deleteRequests = items
        .filter((item) => item[keyName])
        .map((item) => ({
            DeleteRequest: { Key: { [keyName]: item[keyName] } },
        }));

    const deleted = deleteRequests.length;

    while (deleteRequests.length > 0) {
        const batch = deleteRequests.splice(0, 25);
        let unprocessed: Record<string, object[]> | undefined = { [tableName]: batch };

        let attempts = 0;
        const maxAttempts = 5;
        let delay = 100; // start with 100ms delay

        while (unprocessed && Object.keys(unprocessed).length > 0 && attempts < maxAttempts) {
            if (attempts > 0) {
                const jitter = Math.random() * 50;
                await new Promise((resolve) => setTimeout(resolve, delay + jitter));
                delay *= 2;
            }

            const response = await docClient.send(
                new BatchWriteCommand({
                    RequestItems: unprocessed,
                })
            );

            unprocessed = response.UnprocessedItems as Record<string, object[]>;
            attempts++;
        }

        if (unprocessed && Object.keys(unprocessed).length > 0) {
            logger.error(`Failed to delete some items after ${maxAttempts} attempts:`, JSON.stringify(unprocessed));
            throw new Error("DynamoDB batch delete failed due to unprocessed items");
        }
    }

    // Invalidate cache after deletes to avoid re-caching doomed items
    try {
        await redisClient.incr(`version:${tableName}`);
    } catch {
        // Invalidation is best-effort; versioned cache keys expire via TTL
    }

    return deleted;
};
