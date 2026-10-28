/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import * as fs from "fs";

// Deploy-time configuration. Every value that differs per stage or per AWS
// account comes from `.env.<stage>` (loaded by SST), never from source code.

// Throws a loud, actionable error when a required variable is missing
export const requireEnv = (key: string, hint?: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: ${key} environment variable is missing!` +
        (hint ? ` ${hint}` : ""),
    );
  }
  return value;
};

export const optionalEnv = (key: string): string | undefined =>
  process.env[key]?.trim() || undefined;

// "true"/"1"/"yes" → true, "false"/"0"/"no" → false, unset → fallback
export const flagEnv = (key: string, fallback: boolean): boolean => {
  const value = optionalEnv(key)?.toLowerCase();
  if (value === undefined) return fallback;
  if (["true", "1", "yes"].includes(value)) return true;
  if (["false", "0", "no"].includes(value)) return false;
  throw new Error(`CRITICAL CONFIGURATION ERROR: ${key} must be "true" or "false", got "${value}"`);
};

export const isProduction = $app.stage === "production";

export const region = aws.getRegionOutput().name;
export const account = aws.getCallerIdentityOutput({}).accountId;

// Physical name of a stage-owned resource. Production keeps the historical
// unprefixed names; every other stage gets its own `<stage>-` prefix
// (dev → `dev-BarOps-Shift`, pr-42 → `pr-42-BarOps-Shift`).
export const stageResourceName = (baseName: string) =>
  isProduction ? baseName : `${$app.stage}-${baseName}`;

// ---------------------------------------------------------------------------
// Adopting console-created resources (Pulumi `import`)
//
// IMPORT_EXISTING=true makes the stage adopt resources that already exist in
// AWS instead of creating them. Scalar ids come from env vars; bulk ids
// (API routes/integrations, event source mappings) come from the JSON file
// named by IMPORT_IDS_FILE. See architecture/infrastructure-as-code.md.
// ---------------------------------------------------------------------------
export const importExisting = flagEnv("IMPORT_EXISTING", false);

export interface ImportIds {
  httpRoutes?: Record<string, string>;
  httpIntegrations?: Record<string, string>;
  wsRoutes?: Record<string, string>;
  wsIntegrations?: Record<string, string>;
  broadcasterMappings?: Record<string, string>;
}

const loadImportIds = (): ImportIds => {
  const file = optionalEnv("IMPORT_IDS_FILE");
  if (!importExisting || !file) return {};
  if (!fs.existsSync(file)) {
    throw new Error(`CRITICAL CONFIGURATION ERROR: IMPORT_IDS_FILE points to "${file}", which does not exist`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as ImportIds;
};
export const importIds = loadImportIds();

// Resource options for a resource that may already exist. When the stage is
// adopting resources and an id is known, Pulumi imports it; production
// resources are also retained if they ever leave the program.
export const adoptOpts = (id: string | undefined): $util.CustomResourceOptions => {
  const opts: $util.CustomResourceOptions = {};
  if (importExisting && id) opts.import = id;
  if (isProduction) opts.retainOnDelete = true;
  return opts;
};

// Required only when adopting; otherwise the resource is created fresh
export const importIdFromEnv = (key: string): string | undefined =>
  importExisting ? requireEnv(key, "(required because IMPORT_EXISTING=true)") : undefined;
