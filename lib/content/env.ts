const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const PGLITE_PREFIX = "pglite://";

function normalizeEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readEnv(name: string): string | undefined {
  return process.env[name];
}

function isProductionBuildPhase(): boolean {
  return readEnv("NEXT_PHASE") === "phase-production-build";
}

export function getDatabaseUrl(): string | undefined {
  const databaseUrl = normalizeEnvValue(readEnv("DATABASE_URL"));
  if (databaseUrl?.startsWith(PGLITE_PREFIX) && isProductionBuildPhase()) {
    return undefined;
  }

  return databaseUrl;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getBlobReadWriteToken(): string | undefined {
  return normalizeEnvValue(readEnv("BLOB_READ_WRITE_TOKEN"));
}

export function hasBlobReadWriteToken(): boolean {
  return Boolean(getBlobReadWriteToken());
}

export function getAdminUsername(): string {
  return normalizeEnvValue(readEnv("ADMIN_USERNAME")) || "admin";
}

export function getAdminPasswordHash(): string | undefined {
  return normalizeEnvValue(readEnv("ADMIN_PASSWORD_HASH"));
}

export function getAdminPasswordPlain(): string | undefined {
  return normalizeEnvValue(readEnv("ADMIN_PASSWORD"));
}

export function hasAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPasswordHash() || getAdminPasswordPlain());
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminUsername()) && hasAdminPasswordConfigured();
}

export function getAdminSessionSecret(): string {
  return (
    normalizeEnvValue(readEnv("ADMIN_SESSION_SECRET")) ||
    "local-dev-admin-session-secret-change-me"
  );
}

export function getAdminSessionMaxAgeSeconds(): number {
  const raw = Number(readEnv("ADMIN_SESSION_MAX_AGE_SECONDS"));
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  return Math.floor(raw);
}

export function getAdminSessionSecure(): boolean {
  const raw = normalizeEnvValue(readEnv("ADMIN_SESSION_SECURE"))?.toLowerCase();

  if (raw === "1" || raw === "true" || raw === "yes") {
    return true;
  }

  if (raw === "0" || raw === "false" || raw === "no") {
    return false;
  }

  return Boolean(readEnv("VERCEL") === "1" || readEnv("VERCEL_ENV") || readEnv("VERCEL_URL"));
}
