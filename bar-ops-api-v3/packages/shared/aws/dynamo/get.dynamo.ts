import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { docClient } from "./client.dynamo";
import { type DynamoItem, type DateSplitKeys, recombineDatetime } from "./item.dynamo";

import { redisClient, CACHE_TTL_SECONDS, getTableVersion } from "@aws/redis/client.redis";
import { logger } from '@utils/logger/logger.util';

export const get = async <T extends object>(
    tableName: string,
    id: string,
    dto: ClassConstructor<T>,
    dateSplitKeys?: DateSplitKeys
): Promise<T | null> => {
    if (!tableName) {
        throw new Error("Table name is required");
    }
    if (!id) {
        throw new Error("ID is required");
    }

    // Read version before DynamoDB read to avoid stale cache writes
    const version = await getTableVersion(tableName);
    const cacheKey = `get:${tableName}:${version}:${id}`;

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const cachedItem = JSON.parse(cached);
            return plainToInstance(dto, cachedItem, {
                enableImplicitConversion: true,
            });
        }
    } catch (err) {
        logger.error("Redis read error in get helper:", err);
    }

    const command = new GetCommand({
        TableName: tableName,
        Key: { id },
    });

    const response = await docClient.send(command);
    if (!response.Item) {
        return null;
    }

    const itemData = recombineDatetime(response.Item as DynamoItem, dateSplitKeys);

    const instance = plainToInstance(dto, itemData, {
        enableImplicitConversion: true,
    });

    const errors = await validate(instance);
    if (errors.length > 0) {
        throw errors;
    }

    try {
        await redisClient.set(cacheKey, JSON.stringify(itemData), "EX", CACHE_TTL_SECONDS); // cache for hard TTL
    } catch (err) {
        logger.error("Redis write error in get helper:", err);
    }

    return instance;
};
