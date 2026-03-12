import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getAdminPasswordHash,
  getAdminPasswordPlain,
  getAdminSessionMaxAgeSeconds,
  getAdminSessionSecret,
  getAdminUsername,
  hasAdminPasswordConfigured,
  isAdminConfigured,
} from "@/lib/content/env";

const ADMIN_SESSION_COOKIE = "ph_admin_session";

type SessionPayload = {
  username: string;
  expiresAt: number;
};

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

export function isAdminLoginAvailable(): boolean {
  return isAdminConfigured() && hasAdminPasswordConfigured();
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = getAdminSessionMaxAgeSeconds();
  const token = serializeSession({
    username: getAdminUsername(),
    expiresAt: Date.now() + maxAge * 1000,
  });

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return parseSession(token);
}

export async function requireAdminSession(): Promise<SessionPayload> {
  if (!isAdminLoginAvailable()) {
    redirect("/admin/login?error=config");
  }

  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function authenticateAdmin(formData: FormData): Promise<void> {
  const submittedUsername = String(formData.get("username") || "").trim();
  const submittedPassword = String(formData.get("password") || "");
  const expectedUsername = getAdminUsername();
  const configuredHash = getAdminPasswordHash();
  const configuredPassword = getAdminPasswordPlain();

  if (!isAdminLoginAvailable()) {
    redirect("/admin/login?error=config");
  }

  const usernameMatches = submittedUsername === expectedUsername;
  const passwordMatches = configuredHash
    ? verifyPasswordAgainstHash(submittedPassword, configuredHash)
    : configuredPassword === submittedPassword;

  if (!usernameMatches || !passwordMatches) {
    redirect("/admin/login?error=credentials");
  }

  await createAdminSession();
  redirect("/admin");
}
