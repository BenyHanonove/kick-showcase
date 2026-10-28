// Import external framework dependencies and status codes from third party packages
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

export const ebClient = new EventBridgeClient({});
