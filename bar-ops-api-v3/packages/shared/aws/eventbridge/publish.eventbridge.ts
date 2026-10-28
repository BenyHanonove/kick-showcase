// Import external framework dependencies and status codes from third party packages
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ebClient } from "./client.eventbridge";

export interface PublishEventParams<T> {
    source: string;
    detailType: string;
    detail: T;
    eventBusName?: string;
}

// Publish custom event to EventBridge definition for application business logic
export const publishEvent = async <T>(params: PublishEventParams<T>): Promise<void> => {
    const busName = params.eventBusName || process.env.EVENT_BUS_NAME;
    if (!busName) {
        throw new Error("Event bus name is missing");
    }

    await ebClient.send(
        new PutEventsCommand({
            Entries: [
                {
                    Source: params.source,
                    DetailType: params.detailType,
                    Detail: JSON.stringify(params.detail),
                    EventBusName: busName,
                },
            ],
        })
    );
};
