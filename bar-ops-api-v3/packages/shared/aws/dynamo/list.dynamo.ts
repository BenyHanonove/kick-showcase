import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { queryAll, scanAll } from "./paginate.dynamo";
import { type DynamoItem, type DateSplitKeys, recombineDatetime, stripStorageOnlyFields } from "./item.dynamo";

import { redisClient, CACHE_TTL_SECONDS, getTableVersion } from "@aws/redis/client.redis";
import { logger } from '@utils/logger/logger.util';

export interface ListOptions {
    indexName?: string;
    keyConditionExpression?: string;
    filterExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, string | number | boolean | null | undefined>;
}

// Fetch every matching item (Query when a key condition is given, otherwise Scan), cached per table version
export const list = async <T extends object>(
    tableName: string,
    dto: ClassConstructor<T>,
    options?: ListOptions,
    dateSplitKeys?: DateSplitKeys
): Promise<T[]> => {
    if (!tableName) {
        throw new Error("Table name is required");
    }

    const version = await getTableVersion(tableName);

    const queryHash = JSON.stringify({
        indexName: options?.indexName,
        keyConditionExpression: options?.keyConditionExpression,
        filterExpression: options?.filterExpression,
        expressionAttributeNames: options?.expressionAttributeNames,
        expressionAttributeValues: options?.expressionAttributeValues
    });
    const cacheKey = `list:${tableName}:${version}:${queryHash}`;

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const cachedItems = JSON.parse(cached) as object[];
            return plainToInstance(dto, cachedItems, {
                enableImplicitConversion: true,
            });
        }
    } catch (err) {
        logger.error("Redis read error in list helper:", err);
    }

    // Follows LastEvaluatedKey to the end so callers always get the full result set
    const items: DynamoItem[] = options?.keyConditionExpression
        ? await queryAll({
            TableName: tableName,
            IndexName: options.indexName,
            KeyConditionExpression: options.keyConditionExpression,
            FilterExpression: options.filterExpression,
            ExpressionAttributeNames: options.expressionAttributeNames,
            ExpressionAttributeValues: options.expressionAttributeValues,
        })
        : await scanAll({
            TableName: tableName,
            // Expression maps are only legal on a Scan when a filter references them
            ...(options?.filterExpression && {
                FilterExpression: options.filterExpression,
                ExpressionAttributeNames: options.expressionAttributeNames,
                ExpressionAttributeValues: options.expressionAttributeValues,
            }),
        });

    const processedItems = items.map((item) => stripStorageOnlyFields(recombineDatetime(item, dateSplitKeys)));

    const instances = plainToInstance(dto, processedItems, {
        enableImplicitConversion: true,
    });

    const validationResults = await Promise.all(instances.map((instance) => validate(instance)));
    const errors = validationResults.flat();
    if (errors.length > 0) {
        throw errors;
    }

    try {
        await redisClient.set(cacheKey, JSON.stringify(processedItems), "EX", CACHE_TTL_SECONDS); // cache for hard TTL
    } catch (err) {
        logger.error("Redis write error in list helper:", err);
    }

    return instances;
};
