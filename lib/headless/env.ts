import "server-only";

import type { HeadlessMode } from "@/lib/headless/types";

const DEFAULT_REVALIDATE_SECONDS = 300;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readMode(name: string, fallback: HeadlessMode): HeadlessMode {
  const value = readEnv(name)?.toLowerCase();

  if (value === "fallback" || value === "prefer-woo" || value === "required") {
    return value;
  }

  if (value === "prefer-wp") {
    return "prefer-woo";
  }

  return fallback;
}

export function getWordPressBaseUrl(): string | undefined {
  return readEnv("WP_BASE_URL")?.replace(/\/+$/g, "");
}

export function getWooConsumerKey(): string | undefined {
  return readEnv("WC_CONSUMER_KEY");
}

export function getWooConsumerSecret(): string | undefined {
  return readEnv("WC_CONSUMER_SECRET");
}

export function getWordPressAppUser(): string | undefined {
  return readEnv("WP_APP_USER");
}

export function getWordPressAppPassword(): string | undefined {
  return readEnv("WP_APP_PASSWORD");
}

export function getNextRevalidateSecret(): string | undefined {
  return readEnv("NEXT_REVALIDATE_SECRET");
}

export function getHeadlessRevalidateSeconds(): number {
  const raw = Number(readEnv("HEADLESS_REVALIDATE_SECONDS"));
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_REVALIDATE_SECONDS;
  }

  return Math.floor(raw);
}

export function getHeadlessProductsMode(): HeadlessMode {
  return readMode("HEADLESS_PRODUCTS_MODE", "fallback");
}

export function getHeadlessCategoriesMode(): HeadlessMode {
  return readMode("HEADLESS_CATEGORIES_MODE", getHeadlessProductsMode());
}

export function getHeadlessPostsMode(): HeadlessMode {
  return readMode("HEADLESS_POSTS_MODE", "fallback");
}

export function isWooConfigured(): boolean {
  return Boolean(getWordPressBaseUrl() && getWooConsumerKey() && getWooConsumerSecret());
}

export function isWordPressConfigured(): boolean {
  return Boolean(getWordPressBaseUrl());
}

export function isWordPressMediaUploadConfigured(): boolean {
  return Boolean(getWordPressBaseUrl() && getWordPressAppUser() && getWordPressAppPassword());
}
