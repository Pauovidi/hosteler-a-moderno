import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getAdminPasswordHash,
  getAdminPasswordPlain,
  getAdminSessionMaxAgeSeconds,
  getAdminSessionSecure,
  getAdminSessionSecret,
  getAdminUsername,
} from "@/lib/content/env";

const ADMIN_SESSION_COOKIE = "ph_admin_session";

type SessionPayload = {
  username: string;
  expiresAt: number;
};

type AdminSessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export type AdminAuthConfigState =
  | "hash"
  | "plain"
  | "missing"
  | "invalid-hash"
  | "conflict";

type AdminAuthConfig = {
  state: AdminAuthConfigState;
  hash: string | undefined;
  password: string | undefined;
  message: string | null;
};

let lastAdminAuthWarningKey: string | null = null;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getAdminSessionSecret())
    .update(value)
    .digest("base64url");
}

function serializeSession(payload: SessionPayload): string {
  const raw = base64UrlEncode(JSON.stringify(payload));
  return `${raw}.${sign(raw)}`;
}

function parseSession(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [raw, signature] = token.split(".");
  if (!raw || !signature) {
    return null;
  }

  const expectedSignature = sign(raw);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(raw)) as SessionPayload;
    if (!parsed?.username || !parsed?.expiresAt) {
      return null;
    }
    if (parsed.expiresAt < Date.now()) {
      return null;
    }
    if (parsed.username !== getAdminUsername()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hashAdminPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

function verifyPasswordAgainstHash(password: string, hash: string): boolean {
  const [scheme, saltHex, keyHex] = hash.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    return false;
  }

  const derivedKey = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");

  return derivedKey.length === expected.length && timingSafeEqual(derivedKey, expected);
}

function isSupportedAdminPasswordHash(hash: string): boolean {
  const [scheme, saltHex, keyHex] = hash.split(":");
  return (
    scheme === "scrypt"
    && Boolean(saltHex)
    && Boolean(keyHex)
    && /^[0-9a-f]+$/i.test(saltHex)
    && /^[0-9a-f]+$/i.test(keyHex)
  );
}

function warnAdminAuthMisconfiguration(config: AdminAuthConfig): void {
  if (!config.message) {
    return;
  }

  const warningKey = `${config.state}:${config.message}`;
  if (lastAdminAuthWarningKey === warningKey) {
    return;
  }

  lastAdminAuthWarningKey = warningKey;
  console.warn(`[admin-auth] ${config.message}`);
}

function resolveAdminAuthConfig(): AdminAuthConfig {
  const hash = getAdminPasswordHash();
  const password = getAdminPasswordPlain();

  if (hash && !isSupportedAdminPasswordHash(hash)) {
    return {
      state: "invalid-hash",
      hash,
      password,
      message:
        "ADMIN_PASSWORD_HASH existe pero no usa el formato scrypt:<salt_hex>:<derived_key_hex>. Corrige el hash o elimínalo si quieres usar ADMIN_PASSWORD.",
    };
  }

  if (hash && password && !verifyPasswordAgainstHash(password, hash)) {
    return {
      state: "conflict",
      hash,
      password,
      message:
        "ADMIN_PASSWORD_HASH y ADMIN_PASSWORD están definidos pero no coinciden. El login queda deshabilitado hasta alinear ambas variables.",
    };
  }

  if (hash) {
    return {
      state: "hash",
      hash,
      password,
      message: null,
    };
  }

  if (password) {
    return {
      state: "plain",
      hash,
      password,
      message: null,
    };
  }

  return {
    state: "missing",
    hash,
    password,
    message:
      "Falta configurar ADMIN_PASSWORD_HASH o ADMIN_PASSWORD. Si defines ambas, deben representar la misma contraseña.",
  };
}

export function getAdminAuthConfigState(): AdminAuthConfigState {
  const config = resolveAdminAuthConfig();
  warnAdminAuthMisconfiguration(config);
  return config.state;
}

export function getAdminAuthConfigMessage(): string | null {
  const config = resolveAdminAuthConfig();
  warnAdminAuthMisconfiguration(config);
  return config.message;
}

export function isAdminLoginAvailable(): boolean {
  const config = resolveAdminAuthConfig();
  warnAdminAuthMisconfiguration(config);
  return config.state === "hash" || config.state === "plain";
}

export function getAdminSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionCookieOptions(
  maxAge = getAdminSessionMaxAgeSeconds(),
): AdminSessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: getAdminSessionSecure(),
    path: "/",
    maxAge,
  };
}

export function buildAdminSessionToken(): { token: string; maxAge: number } {
  const maxAge = getAdminSessionMaxAgeSeconds();
  return {
    token: serializeSession({
      username: getAdminUsername(),
      expiresAt: Date.now() + maxAge * 1000,
    }),
    maxAge,
  };
}

export function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function validateAdminCredentials(input: {
  username: string;
  password: string;
}): "ok" | "config" | "credentials" {
  const submittedUsername = String(input.username || "").trim();
  const submittedPassword = String(input.password || "");
  const expectedUsername = getAdminUsername();
  const config = resolveAdminAuthConfig();
  warnAdminAuthMisconfiguration(config);

  if (config.state !== "hash" && config.state !== "plain") {
    return "config";
  }

  const usernameMatches = submittedUsername === expectedUsername;
  const passwordMatches =
    config.state === "hash"
      ? verifyPasswordAgainstHash(submittedPassword, config.hash!)
      : submittedPassword === config.password;

  if (!usernameMatches || !passwordMatches) {
    return "credentials";
  }

  return "ok";
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const { token, maxAge } = buildAdminSessionToken();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions(maxAge));
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", getAdminSessionCookieOptions(0));
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return parseSession(token);
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (session) {
    return session;
  }

  if (!isAdminLoginAvailable()) {
    redirect("/admin/login?error=config");
  }

  redirect("/admin/login");
}

export async function authenticateAdmin(formData: FormData): Promise<void> {
  const result = validateAdminCredentials({
    username: String(formData.get("username") || ""),
    password: String(formData.get("password") || ""),
  });

  if (result === "config") {
    redirect("/admin/login?error=config");
  }

  if (result === "credentials") {
    redirect("/admin/login?error=credentials");
  }

  await createAdminSession();
  redirect("/admin");
}
