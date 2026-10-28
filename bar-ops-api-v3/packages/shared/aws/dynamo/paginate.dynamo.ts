import { QueryCommand, ScanCommand, type QueryCommandInput, type ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client.dynamo";
import { type DynamoItem } from "./item.dynamo";

type StartKey = Record<string, unknown> | undefined;

interface Page {
    Items?: Record<string, unknown>[];
    LastEvaluatedKey?: Record<string, unknown>;
}

// A single Scan/Query response is capped at 1MB. Keep requesting with
// ExclusiveStartKey = LastEvaluatedKey until DynamoDB stops returning one,
// otherwise large tables are silently truncated.
export const collectAllPages = async (fetchPage: (startKey: StartKey) => Promise<Page>): Promise<DynamoItem[]> => {
    const items: DynamoItem[] = [];
    let startKey: StartKey;
    do {
        const page = await fetchPage(startKey);
        items.push(...((page.Items ?? []) as DynamoItem[]));
        startKey = page.LastEvaluatedKey;
    } while (startKey);
    return items;
};

export const queryAll = (input: Omit<QueryCommandInput, "ExclusiveStartKey">): Promise<DynamoItem[]> =>
    collectAllPages((startKey) => docClient.send(new QueryCommand({ ...input, ExclusiveStartKey: startKey })));

export const scanAll = (input: Omit<ScanCommandInput, "ExclusiveStartKey">): Promise<DynamoItem[]> =>
    collectAllPages((startKey) => docClient.send(new ScanCommand({ ...input, ExclusiveStartKey: startKey })));
