/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { adoptOpts, stageResourceName } from "./_config.infrastructure";

// Every DynamoDB table of the app, declared once.
//
// The key schemas and GSIs below are derived from how the code reads the
// tables (Key: {...}, IndexName + KeyConditionExpression in packages/**).
// Production tables were created in the console, so with IMPORT_EXISTING=true
// these definitions must match them exactly or Pulumi refuses the import.
// Verify each one with `aws dynamodb describe-table` before the first
// production import (architecture/infrastructure-as-code.md).

type AttrType = "S" | "N";

interface IndexDef {
  hashKey: string;
  rangeKey?: string;
}

interface TableDef {
  hashKey: string;
  // GSI name → keys. Projection is ALL everywhere (handlers read full items).
  indexes?: Record<string, IndexDef>;
  // NEW_AND_OLD_IMAGES stream, read by the pipe to the bus and the broadcaster
  stream?: boolean;
  ttlAttribute?: string;
}

const ATTRIBUTE_TYPES: Record<string, AttrType> = { day: "N" };

const SESSION_ID: Record<string, IndexDef> = { SessionIdIndex: { hashKey: "sessionId" } };
const BY_MONTH_AND_CLIENT: Record<string, IndexDef> = {
  MonthYearIndex: { hashKey: "monthYear", rangeKey: "day" },
  ClientIdIndex: { hashKey: "clientId", rangeKey: "monthYear" },
};

export const TABLE_DEFINITIONS: Record<string, TableDef> = {
  "BarOps-Cashier": { hashKey: "id", indexes: SESSION_ID, stream: true },
  "BarOps-Client": { hashKey: "id", stream: true },
  "BarOps-Consume": { hashKey: "id", indexes: SESSION_ID, stream: true },
  "BarOps-Document": { hashKey: "id", indexes: SESSION_ID },
  "BarOps-Employee": {
    hashKey: "id",
    indexes: {
      PhoneIndex: { hashKey: "phone" },
      IdentityNumberIndex: { hashKey: "identityNumber" },
    },
    stream: true,
  },
  "BarOps-EmployeeUpdateToken": {
    hashKey: "token",
    indexes: { EmployeeIdIndex: { hashKey: "employeeId" } },
    ttlAttribute: "expiresAt",
  },
  "BarOps-Expense": { hashKey: "id", indexes: SESSION_ID, stream: true },
  "BarOps-Interval": { hashKey: "id", indexes: { ShiftIdIndex: { hashKey: "shiftId" } }, stream: true },
  // Mission has no stream (documented in mission.infrastructure.ts) and
  // lower-camel index names
  "BarOps-Mission": {
    hashKey: "id",
    indexes: {
      sessionIdIndex: { hashKey: "sessionId" },
      monthYearIndex: { hashKey: "monthYear" },
    },
  },
  "BarOps-Product": { hashKey: "id", indexes: { SupplierIdIndex: { hashKey: "supplierId" } }, stream: true },
  "BarOps-Reservation": { hashKey: "id", stream: true },
  "BarOps-Sale": { hashKey: "id", indexes: BY_MONTH_AND_CLIENT, stream: true },
  "BarOps-Session": { hashKey: "id", indexes: BY_MONTH_AND_CLIENT, stream: true },
  "BarOps-Shift": {
    hashKey: "id",
    indexes: {
      SessionIdIndex: { hashKey: "sessionId" },
      EmployeeIdIndex: { hashKey: "employeeId" },
    },
    stream: true,
  },
  "BarOps-ShiftRegistrationToken": {
    hashKey: "token",
    indexes: SESSION_ID,
    ttlAttribute: "expiresAt",
  },
  "BarOps-Supplier": { hashKey: "id", stream: true },
  "BarOps-Tips": { hashKey: "id", indexes: SESSION_ID, stream: true },
  "BarOps-Vehicle": { hashKey: "id", indexes: SESSION_ID, stream: true },
  "BarOps-WebSocketConnections": { hashKey: "connectionId", ttlAttribute: "expireAt" },
};

export interface ManagedTable {
  name: string;
  arn: $util.Output<string>;
  indexArn: $util.Output<string>;
  streamArn: $util.Output<string>;
  table: aws.dynamodb.Table;
}

const pascal = (baseName: string) => baseName.replace(/[^A-Za-z0-9]/g, "");

const createTable = (baseName: string): ManagedTable => {
  const def = TABLE_DEFINITIONS[baseName];
  if (!def) {
    throw new Error(`Unknown DynamoDB table "${baseName}": add it to TABLE_DEFINITIONS in _tables.infrastructure.ts`);
  }
  const name = stageResourceName(baseName);

  const keyNames = new Set<string>([def.hashKey]);
  for (const index of Object.values(def.indexes ?? {})) {
    keyNames.add(index.hashKey);
    if (index.rangeKey) keyNames.add(index.rangeKey);
  }

  const table = new aws.dynamodb.Table(
    `${pascal(baseName)}Table`,
    {
      name,
      billingMode: "PAY_PER_REQUEST",
      hashKey: def.hashKey,
      attributes: [...keyNames].map((attr) => ({ name: attr, type: ATTRIBUTE_TYPES[attr] ?? "S" })),
      globalSecondaryIndexes: Object.entries(def.indexes ?? {}).map(([indexName, index]) => ({
        name: indexName,
        hashKey: index.hashKey,
        rangeKey: index.rangeKey,
        projectionType: "ALL",
      })),
      streamEnabled: def.stream ?? false,
      streamViewType: def.stream ? "NEW_AND_OLD_IMAGES" : undefined,
      ttl: def.ttlAttribute ? { attributeName: def.ttlAttribute, enabled: true } : undefined,
    },
    // The import id of a DynamoDB table is its name
    adoptOpts(name),
  );

  return {
    name,
    arn: table.arn,
    indexArn: $interpolate`${table.arn}/index/*`,
    streamArn: table.streamArn,
    table,
  };
};

const registry = new Map<string, ManagedTable>();

// Returns the managed table for a base name (`BarOps-Shift`). Several modules
// reference the same table; it is declared exactly once.
export const dynamoTable = (baseName: string): ManagedTable => {
  let entry = registry.get(baseName);
  if (!entry) {
    entry = createTable(baseName);
    registry.set(baseName, entry);
  }
  return entry;
};

export const streamTables = () =>
  Object.entries(TABLE_DEFINITIONS)
    .filter(([, def]) => def.stream)
    .map(([baseName]) => baseName);
