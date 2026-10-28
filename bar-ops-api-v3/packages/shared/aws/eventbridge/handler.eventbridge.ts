import { type EventBridgeEvent, type DynamoDBRecord } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { type AttributeValue } from "@aws-sdk/client-dynamodb";

export interface ParsedDynamoRecord<T> {
    eventName: "INSERT" | "MODIFY" | "REMOVE";
    keys: Record<string, string | number | boolean>;
    newImage: T | null;
    oldImage: T | null;
    eventSourceARN?: string;
}

// Wrapper for stream events
export const wrapDynamoStreamHandler = <T>(
    handler: (record: ParsedDynamoRecord<T>) => Promise<void>,
    tableArnSubstring?: string
) => {
    return async (event: EventBridgeEvent<string, DynamoDBRecord>): Promise<void> => {
        const record = event.detail;

        const expectedParent = tableArnSubstring || process.env.PARENT_TABLE;
        if (expectedParent && record.eventSourceARN && !record.eventSourceARN.includes(expectedParent)) {
            return;
        }

        const keys = record.dynamodb?.Keys
            ? (unmarshall(record.dynamodb.Keys as Record<string, AttributeValue>) as Record<string, string | number | boolean>)
            : {};

        const newImage = record.dynamodb?.NewImage
            ? (unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>) as T)
            : null;

        const oldImage = record.dynamodb?.OldImage
            ? (unmarshall(record.dynamodb.OldImage as Record<string, AttributeValue>) as T)
            : null;

        const eventName = record.eventName as "INSERT" | "MODIFY" | "REMOVE" | undefined;
        if (!eventName) return;

        await handler({
            eventName,
            keys,
            newImage,
            oldImage,
            eventSourceARN: record.eventSourceARN,
        });
    };
};

// Wrapper for custom EventBridge events
export const wrapCustomEventHandler = <T>(
    handler: (detail: T, source: string, detailType: string) => Promise<void>
) => {
    return async (event: EventBridgeEvent<string, T>): Promise<void> => {
        await handler(event.detail, event.source, event["detail-type"]);
    };
};

