export const QUOTE_CATEGORIES = [
  "Servilletas",
  "Cristalería",
  "Vajilla",
  "Cubertería",
  "Textil Hoteles",
  "Otros",
] as const;

export const QUOTE_ATTACHMENT_FIELD_NAME = "archivo";
export const QUOTE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const QUOTE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
] as const;

export const QUOTE_FILE_ACCEPT = QUOTE_ALLOWED_MIME_TYPES.join(",");

const EXTENSION_TO_MIME = new Map<string, (typeof QUOTE_ALLOWED_MIME_TYPES)[number]>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

export function isQuoteCategory(value: string): value is (typeof QUOTE_CATEGORIES)[number] {
  return QUOTE_CATEGORIES.includes(value as (typeof QUOTE_CATEGORIES)[number]);
}

export function getAllowedQuoteMimeType(value: string, filename?: string): string | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (QUOTE_ALLOWED_MIME_TYPES.includes(normalized as (typeof QUOTE_ALLOWED_MIME_TYPES)[number])) {
    return normalized;
  }

  const extension = String(filename || "").trim().toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  if (!extension) {
    return null;
  }

  return EXTENSION_TO_MIME.get(extension) ?? null;
}
