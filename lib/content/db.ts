import "server-only";

import { neon } from "@neondatabase/serverless";

import {
  EditableBlogPostRecord,
  EditableProductRecord,
  PublishStatus,
} from "@/lib/content/types";
import { getDatabaseUrl, hasDatabaseUrl } from "@/lib/content/env";

type SqlPrimitive = string | number | boolean | null | Date;
type SqlRow = Record<string, SqlPrimitive>;

let ensureSchemaPromise: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  return neon(databaseUrl);
}

function parsePayload(value: SqlPrimitive): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mapProductRow(row: SqlRow): EditableProductRecord {
  return {
    recordId: String(row.record_id || ""),
    legacyId: row.legacy_id ? String(row.legacy_id) : null,
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    status: row.status === "published" ? "published" : "draft",
    payload: parsePayload(row.payload),
    imageUrl: row.image_url ? String(row.image_url) : null,
    updatedAt: String(row.updated_at || ""),
    createdAt: String(row.created_at || ""),
  };
}

function mapBlogRow(row: SqlRow): EditableBlogPostRecord {
  return {
    recordId: String(row.record_id || ""),
    legacyId: row.legacy_id ? String(row.legacy_id) : null,
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    status: row.status === "published" ? "published" : "draft",
    excerpt: String(row.excerpt || ""),
    legacyUrl: row.legacy_url ? String(row.legacy_url) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    featuredImageUrl: row.featured_image_url ? String(row.featured_image_url) : null,
    payload: parsePayload(row.payload),
    updatedAt: String(row.updated_at || ""),
    createdAt: String(row.created_at || ""),
  };
}

async function runStatement(statement: string) {
  const sql = getSqlClient();
  if (!sql) {
    return;
  }

  await sql(statement);
}

export async function ensureContentSchema(): Promise<void> {
  if (!hasDatabaseUrl()) {
    return;
  }

  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await runStatement(`
        CREATE TABLE IF NOT EXISTS editable_products (
          record_id TEXT PRIMARY KEY,
          legacy_id TEXT UNIQUE,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          image_url TEXT,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await runStatement(`
        CREATE INDEX IF NOT EXISTS editable_products_status_idx
        ON editable_products (status);
      `);
      await runStatement(`
        CREATE INDEX IF NOT EXISTS editable_products_updated_at_idx
        ON editable_products (updated_at DESC);
      `);
      await runStatement(`
        CREATE TABLE IF NOT EXISTS editable_blog_posts (
          record_id TEXT PRIMARY KEY,
          legacy_id TEXT UNIQUE,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          legacy_url TEXT UNIQUE,
          featured_image_url TEXT,
          published_at TIMESTAMPTZ,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await runStatement(`
        CREATE INDEX IF NOT EXISTS editable_blog_posts_status_idx
        ON editable_blog_posts (status);
      `);
      await runStatement(`
        CREATE INDEX IF NOT EXISTS editable_blog_posts_published_at_idx
        ON editable_blog_posts (published_at DESC NULLS LAST, updated_at DESC);
      `);
    })();
  }

  await ensureSchemaPromise;
}

async function runQuery<T extends SqlRow = SqlRow>(
  strings: TemplateStringsArray,
  ...values: SqlPrimitive[]
): Promise<T[]> {
  const sql = getSqlClient();
  if (!sql) {
    return [];
  }

  await ensureContentSchema();
  return (await sql<T>(strings, ...values)) ?? [];
}

export async function listEditableProducts(): Promise<EditableProductRecord[]> {
  const rows = await runQuery`
    SELECT record_id, legacy_id, slug, title, status, image_url, payload::text AS payload, created_at, updated_at
    FROM editable_products
    ORDER BY updated_at DESC, created_at DESC;
  `;
  return rows.map(mapProductRow);
}

export async function getEditableProductRecordByRecordId(
  recordId: string,
): Promise<EditableProductRecord | null> {
  const rows = await runQuery`
    SELECT record_id, legacy_id, slug, title, status, image_url, payload::text AS payload, created_at, updated_at
    FROM editable_products
    WHERE record_id = ${recordId}
    LIMIT 1;
  `;
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function getEditableProductRecordByLegacyId(
  legacyId: string,
): Promise<EditableProductRecord | null> {
  const rows = await runQuery`
    SELECT record_id, legacy_id, slug, title, status, image_url, payload::text AS payload, created_at, updated_at
    FROM editable_products
    WHERE legacy_id = ${legacyId}
    LIMIT 1;
  `;
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function getEditableProductRecordBySlug(
  slug: string,
): Promise<EditableProductRecord | null> {
  const rows = await runQuery`
    SELECT record_id, legacy_id, slug, title, status, image_url, payload::text AS payload, created_at, updated_at
    FROM editable_products
    WHERE slug = ${slug}
    LIMIT 1;
  `;
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function listEditableBlogPosts(): Promise<EditableBlogPostRecord[]> {
  const rows = await runQuery`
    SELECT record_id, legacy_id, slug, title, excerpt, status, legacy_url, featured_image_url, published_at, payload::text AS payload, created_at, updated_at
    FROM editable_blog_posts
    ORDER BY COALESCE(published_at, updated_at) DESC, updated_at DESC;
  `;
  return rows.map(mapBlogRow);
}

export async function getEditableProductsCount(): Promise<number> {
  const rows = await runQuery<{ total: number }>`
    SELECT COUNT(*)::int AS total
    FROM editable_products;
  `;
  return Number(rows[0]?.total || 0);
}

export async function getEditableBlogPostsCount(): Promise<number> {
  const rows = await runQuery<{ total: number }>`
    SELECT COUNT(*)::int AS total
    FROM editable_blog_posts;
  `;
  return Number(rows[0]?.total || 0);
}

export async function upsertEditableProductRecord(input: {
  recordId: string;
  legacyId: string | null;
  slug: string;
  title: string;
  status: PublishStatus;
  imageUrl: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  await runQuery`
    INSERT INTO editable_products (
      record_id,
      legacy_id,
      slug,
      title,
      status,
      image_url,
      payload,
      created_at,
      updated_at
    )
    VALUES (
      ${input.recordId},
      ${input.legacyId},
      ${input.slug},
      ${input.title},
      ${input.status},
      ${input.imageUrl},
      ${JSON.stringify(input.payload)},
      NOW(),
      NOW()
    )
    ON CONFLICT (record_id) DO UPDATE
    SET
      legacy_id = EXCLUDED.legacy_id,
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      image_url = EXCLUDED.image_url,
      payload = EXCLUDED.payload,
      updated_at = NOW();
  `;
}

export async function deleteEditableProductRecord(recordId: string): Promise<void> {
  await runQuery`
    DELETE FROM editable_products
    WHERE record_id = ${recordId};
  `;
}

export async function upsertEditableBlogPostRecord(input: {
  recordId: string;
  legacyId: string | null;
  slug: string;
  title: string;
  excerpt: string;
  status: PublishStatus;
  legacyUrl: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  await runQuery`
    INSERT INTO editable_blog_posts (
      record_id,
      legacy_id,
      slug,
      title,
      excerpt,
      status,
      legacy_url,
      featured_image_url,
      published_at,
      payload,
      created_at,
      updated_at
    )
    VALUES (
      ${input.recordId},
      ${input.legacyId},
      ${input.slug},
      ${input.title},
      ${input.excerpt},
      ${input.status},
      ${input.legacyUrl},
      ${input.featuredImageUrl},
      ${input.publishedAt},
      ${JSON.stringify(input.payload)},
      NOW(),
      NOW()
    )
    ON CONFLICT (record_id) DO UPDATE
    SET
      legacy_id = EXCLUDED.legacy_id,
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      status = EXCLUDED.status,
      legacy_url = EXCLUDED.legacy_url,
      featured_image_url = EXCLUDED.featured_image_url,
      published_at = EXCLUDED.published_at,
      payload = EXCLUDED.payload,
      updated_at = NOW();
  `;
}
