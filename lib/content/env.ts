const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function normalizeEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function getDatabaseUrl(): string | undefined {
  return normalizeEnvValue(process.env.DATABASE_URL);
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getBlobReadWriteToken(): string | undefined {
  return normalizeEnvValue(process.env.BLOB_READ_WRITE_TOKEN);
}

export function hasBlobReadWriteToken(): boolean {
  return Boolean(getBlobReadWriteToken());
}

export function getAdminUsername(): string {
  return normalizeEnvValue(process.env.ADMIN_USERNAME) || "admin";
}

export function getAdminPasswordHash(): string | undefined {
  return normalizeEnvValue(process.env.ADMIN_PASSWORD_HASH);
}

export function getAdminPasswordPlain(): string | undefined {
  return normalizeEnvValue(process.env.ADMIN_PASSWORD);
}

export function hasAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPasswordHash() || getAdminPasswordPlain());
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminUsername()) && hasAdminPasswordConfigured();
}

export function getAdminSessionSecret(): string {
  return (
    normalizeEnvValue(process.env.ADMIN_SESSION_SECRET) ||
    "local-dev-admin-session-secret-change-me"
  );
}

export function getAdminSessionMaxAgeSeconds(): number {
  const raw = Number(process.env.ADMIN_SESSION_MAX_AGE_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  return Math.floor(raw);
}
