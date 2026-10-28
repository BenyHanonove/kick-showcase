import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { traceClient } from "@utils/observability/tracer.util";

export const ebClient = traceClient(new EventBridgeClient({}));
