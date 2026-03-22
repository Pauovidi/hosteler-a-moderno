import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";

import {
  EditableBlogPostRecord,
  EditableProductRecord,
  PublishStatus,
} from "@/lib/content/types";
import { getDatabaseUrl, hasDatabaseUrl } from "@/lib/content/env";

type SqlPrimitive = string | number | boolean | null | Date;
type SqlRow = Record<string, SqlPrimitive>;
type QueryValues = SqlPrimitive[];
type SqlClient = {
  query<T extends SqlRow = SqlRow>(statement: string, values?: QueryValues): Promise<T[]>;
  exec(statement: string): Promise<void>;
};

const PGLITE_PREFIX = "pglite://";

let ensureSchemaPromise: Promise<void> | null = null;
let ensureSchemaKey: string | null = null;
let neonClient: ReturnType<typeof neon> | null = null;
let neonClientKey: string | null = null;
let pgliteClientPromise: Promise<PGlite> | null = null;
let pgliteClientKey: string | null = null;

const CONTENT_SCHEMA_BOOTSTRAP_LOCK_KEY = "content-schema-bootstrap-v1";

const CONTENT_SCHEMA_STATEMENTS = [
  `
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
  `,
  `
    CREATE INDEX IF NOT EXISTS editable_products_status_idx
    ON editable_products (status);
  `,
  `
    CREATE INDEX IF NOT EXISTS editable_products_updated_at_idx
    ON editable_products (updated_at DESC);
  `,
  `
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
  `,
  `
    CREATE INDEX IF NOT EXISTS editable_blog_posts_status_idx
    ON editable_blog_posts (status);
  `,
  `
    CREATE INDEX IF NOT EXISTS editable_blog_posts_published_at_idx
    ON editable_blog_posts (published_at DESC NULLS LAST, updated_at DESC);
  `,
];

function isPgliteDatabaseUrl(databaseUrl: string): boolean {
  return databaseUrl.startsWith(PGLITE_PREFIX);
}

function resolvePgliteDataDir(databaseUrl: string): string | undefined {
  const target = databaseUrl.slice(PGLITE_PREFIX.length).trim();
  if (!target || target === "memory" || target === ":memory:") {
    return undefined;
  }

  return path.isAbsolute(target) ? target : path.resolve(target);
}

async function getPgliteClient(databaseUrl: string): Promise<PGlite> {
  if (!pgliteClientPromise || pgliteClientKey !== databaseUrl) {
    pgliteClientKey = databaseUrl;
    pgliteClientPromise = (async () => {
      const dataDir = resolvePgliteDataDir(databaseUrl);
      if (!dataDir) {
        return new PGlite();
      }

      await mkdir(dataDir, { recursive: true });
      return new PGlite(dataDir);
    })();
  }

  return pgliteClientPromise;
}

function getNeonClient(databaseUrl: string) {
  if (!neonClient || neonClientKey !== databaseUrl) {
    neonClientKey = databaseUrl;
    neonClient = neon(databaseUrl);
  }

  return neonClient;
}

async function getSqlClient(): Promise<SqlClient | null> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  if (isPgliteDatabaseUrl(databaseUrl)) {
    const client = await getPgliteClient(databaseUrl);
    return {
      async query<T extends SqlRow = SqlRow>(statement: string, values: QueryValues = []) {
        const result = await client.query<T>(statement, values);
        return result.rows ?? [];
      },
      async exec(statement: string) {
        await client.exec(statement);
      },
    };
  }

  const client = getNeonClient(databaseUrl);
  return {
    async query<T extends SqlRow = SqlRow>(statement: string, values: QueryValues = []) {
      return (await client.query<T>(statement, values)) ?? [];
    },
    async exec(statement: string) {
      await client.query(statement);
    },
  };
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
  const sql = await getSqlClient();
  if (!sql) {
    return;
  }

  await sql.exec(statement);
}

function buildPostgresBootstrapStatement(): string {
  const escapedLockKey = CONTENT_SCHEMA_BOOTSTRAP_LOCK_KEY.replace(/'/g, "''");
  const statements = CONTENT_SCHEMA_STATEMENTS.join("\n");

  return `
    DO $content_schema$
    BEGIN
      PERFORM pg_advisory_xact_lock(hashtext('${escapedLockKey}'));
      ${statements}
    END
    $content_schema$;
  `;
}

function buildParameterizedQuery(
  strings: TemplateStringsArray,
  values: QueryValues,
): { statement: string; params: QueryValues } {
  let statement = strings[0] || "";

  values.forEach((value, index) => {
    statement += `$${index + 1}${strings[index + 1] || ""}`;
  });

  return { statement, params: values };
}

export async function ensureContentSchema(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl || !hasDatabaseUrl()) {
    return;
  }

  if (!ensureSchemaPromise || ensureSchemaKey !== databaseUrl) {
    ensureSchemaKey = databaseUrl;
    ensureSchemaPromise = (async () => {
      if (isPgliteDatabaseUrl(databaseUrl)) {
        for (const statement of CONTENT_SCHEMA_STATEMENTS) {
          await runStatement(statement);
        }
        return;
      }

      await runStatement(buildPostgresBootstrapStatement());
    })();
  }

  await ensureSchemaPromise;
}

function isMissingContentSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  if (code === "42P01" || code === "3F000") {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    (message.includes("editable_products") || message.includes("editable_blog_posts"))
    && (
      message.includes("does not exist")
      || message.includes("relation")
      || message.includes("schema")
    )
  );
}

async function runReadQuery<T extends SqlRow = SqlRow>(
  strings: TemplateStringsArray,
  ...values: SqlPrimitive[]
): Promise<T[]> {
  const sql = await getSqlClient();
  if (!sql) {
    return [];
  }

  const { statement, params } = buildParameterizedQuery(strings, values);

  try {
    return await sql.query<T>(statement, params);
  } catch (error) {
    if (isMissingContentSchemaError(error)) {
      return [];
    }
    throw error;
  }
}

async function runWriteQuery<T extends SqlRow = SqlRow>(
  strings: TemplateStringsArray,
  ...values: SqlPrimitive[]
): Promise<T[]> {
  const sql = await getSqlClient();
  if (!sql) {
    return [];
  }

  await ensureContentSchema();
  const { statement, params } = buildParameterizedQuery(strings, values);
  return await sql.query<T>(statement, params);
}

export async function listEditableProducts(): Promise<EditableProductRecord[]> {
  const rows = await runReadQuery`
    SELECT record_id, legacy_id, slug, title, status, image_url, payload::text AS payload, created_at, updated_at
    FROM editable_products
    ORDER BY updated_at DESC, created_at DESC;
  `;
  return rows.map(mapProductRow);
}

export async function getEditableProductRecordByRecordId(
  recordId: string,
): Promise<EditableProductRecord | null> {
  const rows = await runReadQuery`
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
  const rows = await runReadQuery`
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
  const rows = await runReadQuery`
    SELECT record_id, legacy_id, slug, title, status, image_url, payload::text AS payload, created_at, updated_at
    FROM editable_products
    WHERE slug = ${slug}
    LIMIT 1;
  `;
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function listEditableBlogPosts(): Promise<EditableBlogPostRecord[]> {
  const rows = await runReadQuery`
    SELECT record_id, legacy_id, slug, title, excerpt, status, legacy_url, featured_image_url, published_at, payload::text AS payload, created_at, updated_at
    FROM editable_blog_posts
    ORDER BY COALESCE(published_at, updated_at) DESC, updated_at DESC;
  `;
  return rows.map(mapBlogRow);
}

export async function getEditableBlogPostRecordByRecordId(
  recordId: string,
): Promise<EditableBlogPostRecord | null> {
  const rows = await runReadQuery`
    SELECT record_id, legacy_id, slug, title, excerpt, status, legacy_url, featured_image_url, published_at, payload::text AS payload, created_at, updated_at
    FROM editable_blog_posts
    WHERE record_id = ${recordId}
    LIMIT 1;
  `;
  return rows[0] ? mapBlogRow(rows[0]) : null;
}

export async function getEditableBlogPostRecordByLegacyId(
  legacyId: string,
): Promise<EditableBlogPostRecord | null> {
  const rows = await runReadQuery`
    SELECT record_id, legacy_id, slug, title, excerpt, status, legacy_url, featured_image_url, published_at, payload::text AS payload, created_at, updated_at
    FROM editable_blog_posts
    WHERE legacy_id = ${legacyId}
    LIMIT 1;
  `;
  return rows[0] ? mapBlogRow(rows[0]) : null;
}

export async function getEditableBlogPostRecordBySlug(
  slug: string,
): Promise<EditableBlogPostRecord | null> {
  const rows = await runReadQuery`
    SELECT record_id, legacy_id, slug, title, excerpt, status, legacy_url, featured_image_url, published_at, payload::text AS payload, created_at, updated_at
    FROM editable_blog_posts
    WHERE slug = ${slug}
    LIMIT 1;
  `;
  return rows[0] ? mapBlogRow(rows[0]) : null;
}

export async function getEditableProductsCount(): Promise<number> {
  const rows = await runReadQuery<{ total: number }>`
    SELECT COUNT(*)::int AS total
    FROM editable_products;
  `;
  return Number(rows[0]?.total || 0);
}

export async function getEditableBlogPostsCount(): Promise<number> {
  const rows = await runReadQuery<{ total: number }>`
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
  await runWriteQuery`
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
  await runWriteQuery`
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
  await runWriteQuery`
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

export async function deleteEditableBlogPostRecord(recordId: string): Promise<void> {
  await runWriteQuery`
    DELETE FROM editable_blog_posts
    WHERE record_id = ${recordId};
  `;
}
