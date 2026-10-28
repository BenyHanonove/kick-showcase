/// <reference path="../.sst/platform/config.d.ts" />

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
