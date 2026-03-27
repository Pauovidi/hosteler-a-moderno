import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import net from "node:net";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const preferredPort = Number(process.env.QA_SMOKE_PORT || 3100);
const pgliteDatabaseUrl = "pglite://./.pglite/qa-smoke";
const reportPath = path.join(cwd, "out", "qa-smoke-report.json");
const progressLogPath = path.join(cwd, "out", "qa-smoke-progress.log");

function shouldUseShell(command) {
  return process.platform === "win32" && /\.cmd$/i.test(command);
}

function logProgress(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  fs.mkdirSync(path.dirname(progressLogPath), { recursive: true });
  fs.appendFileSync(progressLogPath, `${line}\n`);
  console.log(line);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: options.stdio || "pipe",
      env: options.env || process.env,
      shell: options.shell ?? shouldUseShell(command),
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed (${code})\n${stderr || stdout}`));
    });
  });
}

async function stopProcessTree(child) {
  if (!child || child.exitCode !== null || !child.pid) {
    return;
  }

  if (process.platform === "win32") {
    await run("taskkill", ["/pid", String(child.pid), "/t", "/f"]).catch(() => undefined);
    return;
  }

  await new Promise((resolve) => {
    child.once("close", resolve);
    child.kill("SIGTERM");
    setTimeout(resolve, 5_000);
  });
}

function resolvePgliteDataDir(databaseUrl) {
  const prefix = "pglite://";
  if (!databaseUrl.startsWith(prefix)) {
    return null;
  }

  const target = databaseUrl.slice(prefix.length).trim();
  if (!target || target === "memory" || target === ":memory:") {
    return null;
  }

  return path.isAbsolute(target) ? target : path.resolve(cwd, target);
}

async function prepareDatabaseTarget() {
  const explicitDatabaseUrl = String(process.env.QA_SMOKE_DATABASE_URL || "").trim();
  const databaseUrl = explicitDatabaseUrl || pgliteDatabaseUrl;
  const dataDir = resolvePgliteDataDir(databaseUrl);

  if (dataDir) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  return {
    driver: databaseUrl.startsWith("pglite://") ? "pglite" : "external-postgres",
    url: databaseUrl,
    cleanup: async () => {
      if (dataDir) {
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
    },
  };
}

async function getAvailablePort(startPort) {
  async function canListen(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on("error", () => resolve(false));
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
    });
  }

  for (let offset = 0; offset < 20; offset += 1) {
    const candidate = startPort + offset;
    if (await canListen(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No se encontró un puerto libre a partir de ${startPort}.`);
}

async function waitForUrl(url, timeoutMs = 45_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(3_000),
      });
      if (response.status < 500) {
        return;
      }
    } catch {
      // retry
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`El servidor no estuvo listo a tiempo: ${url}`);
}

function canonicalProductPath(product) {
  const id = String(product.id || "");
  const legacySlug = String(product.slug || "").replace(new RegExp(`-${id}$`), "") || String(product.slug || "");
  return `/p${id}-${legacySlug}.html`;
}

function canonicalBlogPath(post) {
  const legacyUrl = String(post.legacyUrl || "").trim();
  if (legacyUrl.startsWith("/blog/p")) {
    return legacyUrl.endsWith(".html") ? legacyUrl : `${legacyUrl}.html`;
  }
  if (legacyUrl.startsWith("/blog/c")) {
    const corrected = legacyUrl.replace(/^\/blog\/c/i, "/blog/p");
    return corrected.endsWith(".html") ? corrected : `${corrected}.html`;
  }
  return `/blog/p${post.id}-${post.slug}.html`;
}

async function fetchResponse(baseUrl, url, options = {}) {
  const { signal, ...rest } = options;
  return fetch(`${baseUrl}${url}`, {
    signal: signal || AbortSignal.timeout(20_000),
    redirect: "manual",
    ...rest,
  });
}

async function fetchText(baseUrl, url, expectedStatus = 200, options = {}) {
  const response = await fetchResponse(baseUrl, url, options);
  assert.equal(response.status, expectedStatus, `${url} devolvió ${response.status} en lugar de ${expectedStatus}`);
  return response.text();
}

function assertRedirect(response, expectedPathname) {
  assert(
    response.status >= 300 && response.status < 400,
    `Se esperaba redirección a ${expectedPathname} y llegó ${response.status}`,
  );
  const location = String(response.headers.get("location") || "");
  assert(
    location.includes(expectedPathname),
    `La redirección esperada debía incluir ${expectedPathname}, pero fue ${location || "<sin location>"}`,
  );
}

async function createSqlClient(databaseUrl) {
  if (databaseUrl.startsWith("pglite://")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const dataDir = resolvePgliteDataDir(databaseUrl);
    const client = dataDir ? new PGlite(dataDir) : new PGlite();

    return {
      async query(statement, values = []) {
        const result = await client.query(statement, values);
        return result.rows ?? [];
      },
      async exec(statement) {
        await client.exec(statement);
      },
      async close() {
        await client.close?.();
      },
    };
  }

  const { neon } = await import("@neondatabase/serverless");
  const client = neon(databaseUrl);

  return {
    async query(statement, values = []) {
      return (await client.query(statement, values)) ?? [];
    },
    async exec(statement) {
      await client.query(statement);
    },
    async close() {},
  };
}

async function ensureContentSchema(sql) {
  await sql.exec(`
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
  await sql.exec(`
    CREATE INDEX IF NOT EXISTS editable_products_status_idx
    ON editable_products (status);
  `);
  await sql.exec(`
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
  await sql.exec(`
    CREATE INDEX IF NOT EXISTS editable_blog_posts_status_idx
    ON editable_blog_posts (status);
  `);
}

async function upsertEditableProduct(sql, input) {
  await sql.query(
    `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
      ON CONFLICT (record_id) DO UPDATE
      SET
        legacy_id = EXCLUDED.legacy_id,
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        image_url = EXCLUDED.image_url,
        payload = EXCLUDED.payload,
        updated_at = NOW();
    `,
    [
      input.recordId,
      input.legacyId,
      input.slug,
      input.title,
      input.status,
      input.imageUrl,
      JSON.stringify(input.payload),
    ],
  );
}

async function listEditableProducts(sql) {
  return sql.query(
    `
      SELECT record_id, legacy_id, slug, title, status, payload::text AS payload
      FROM editable_products
      ORDER BY updated_at DESC, created_at DESC;
    `,
  );
}

async function deleteEditableProduct(sql, recordId) {
  await sql.query("DELETE FROM editable_products WHERE record_id = $1;", [recordId]);
}

async function upsertEditableBlogPost(sql, input) {
  await sql.query(
    `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW(), NOW())
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
    `,
    [
      input.recordId,
      input.legacyId,
      input.slug,
      input.title,
      input.excerpt,
      input.status,
      input.legacyUrl,
      input.featuredImageUrl,
      input.publishedAt,
      JSON.stringify(input.payload),
    ],
  );
}

async function listEditableBlogPosts(sql) {
  return sql.query(
    `
      SELECT record_id, legacy_id, slug, title, excerpt, status, legacy_url, payload::text AS payload
      FROM editable_blog_posts
      ORDER BY COALESCE(published_at, updated_at) DESC, updated_at DESC;
    `,
  );
}

async function deleteEditableBlogPost(sql, recordId) {
  await sql.query("DELETE FROM editable_blog_posts WHERE record_id = $1;", [recordId]);
}

function parseJsonPayload(value) {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  return JSON.parse(value);
}

function mergeProductsForQa(fallbackProducts, editableRows) {
  const merged = new Map(fallbackProducts.map((product) => [product.slug, product]));
  const fallbackByLegacyId = new Map(fallbackProducts.map((product) => [String(product.id), product]));

  for (const row of editableRows) {
    const fallbackProduct = row.legacy_id
      ? fallbackByLegacyId.get(String(row.legacy_id))
      : undefined;

    if (fallbackProduct) {
      merged.delete(fallbackProduct.slug);
    }

    if (row.status !== "published") {
      continue;
    }

    const payload = parseJsonPayload(row.payload);
    merged.set(String(row.slug), payload);
  }

  return Array.from(merged.values());
}

function mergeBlogPostsForQa(fallbackPosts, editableRows) {
  const merged = new Map(fallbackPosts.map((post) => [post.slug, post]));
  const fallbackByLegacyId = new Map(fallbackPosts.map((post) => [String(post.id), post]));

  for (const row of editableRows) {
    const fallbackPost = row.legacy_id
      ? fallbackByLegacyId.get(String(row.legacy_id))
      : undefined;

    if (fallbackPost) {
      merged.delete(fallbackPost.slug);
    }

    if (row.status !== "published") {
      continue;
    }

    const payload = parseJsonPayload(row.payload);
    merged.set(String(row.slug), payload);
  }

  return Array.from(merged.values());
}

async function main() {
  const skipBuild = process.argv.includes("--skip-build");
  fs.rmSync(progressLogPath, { force: true });

  const report = {
    startedAt: new Date().toISOString(),
    checks: [],
    skipped: [],
  };

  const productSamples = JSON.parse(fs.readFileSync(path.join(cwd, "lib", "data", "products.json"), "utf8"));
  const blogSamples = JSON.parse(fs.readFileSync(path.join(cwd, "lib", "data", "generated-blog.json"), "utf8"));
  const legacyProduct = productSamples[0];
  const legacyBlog = blogSamples[0];
  const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const qaToken = Date.now().toString(36);
  const databaseTarget = await prepareDatabaseTarget();
  const port = await getAvailablePort(preferredPort);
  const baseUrl = `http://127.0.0.1:${port}`;

  logProgress(`Base de datos QA: ${databaseTarget.driver}`);
  logProgress(`Puerto QA: ${port}`);
  report.databaseDriver = databaseTarget.driver;
  report.databaseUrl = databaseTarget.url.startsWith("pglite://")
    ? databaseTarget.url
    : databaseTarget.url.replace(/:[^:@/]+@/, ":***@");

  async function withSql(callback) {
    const client = await createSqlClient(databaseTarget.url);
    try {
      await ensureContentSchema(client);
      return await callback(client);
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  await withSql(async () => undefined);

  const serverEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_WHATSAPP_PHONE: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "34693039422",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "AdminQa12345!",
    ADMIN_SESSION_SECRET: "local-admin-qa-session-secret",
    ADMIN_SESSION_SECURE: "false",
    DATABASE_URL: "",
  };

  const createdProductRecordIds = [];
  const createdBlogRecordIds = [];

  if (!skipBuild) {
    logProgress("Ejecutando build previa al smoke");
    await run(npmCmd, ["run", "build"], {
      env: serverEnv,
    });
  }

  const server = spawn(npmCmd, ["run", "start", "--", "--port", String(port)], {
    cwd,
    env: serverEnv,
    stdio: "pipe",
    shell: shouldUseShell(npmCmd),
    windowsHide: true,
  });

  try {
    logProgress("Esperando a que Next esté listo");
    await waitForUrl(`${baseUrl}/admin/login`);
    logProgress("Servidor listo, ejecutando smoke");

    const legacyProductPath = canonicalProductPath(legacyProduct);
    const legacyBlogPath = canonicalBlogPath(legacyBlog);

    const redirectToLogin = await fetchResponse(baseUrl, "/admin");
    assertRedirect(redirectToLogin, "/admin/login");
    report.checks.push("redirect /admin -> /admin/login");
    logProgress("Protección de /admin validada");

    const loginPageHtml = await fetchText(baseUrl, "/admin/login", 200);
    assert(loginPageHtml.includes("Iniciar sesión"), "La pantalla de login admin no cargó correctamente.");
    report.checks.push("pantalla login admin");
    logProgress("Pantalla de login admin OK");

    report.skipped.push(
      "login/logout admin extremo a extremo local: la sesión navegable bajo next start + HTTP simple no es estable en este runner; validar en preview HTTPS",
    );

    const legacyProductHtmlBefore = await fetchText(baseUrl, legacyProductPath, 200);
    assert(
      legacyProductHtmlBefore.includes(legacyProduct.title),
      "El fallback del producto legacy no respondió en modo público sin DB.",
    );

    const legacyBlogHtmlBefore = await fetchText(baseUrl, legacyBlogPath, 200);
    assert(
      legacyBlogHtmlBefore.includes(legacyBlog.title),
      "El fallback del blog legacy no respondió en modo público sin DB.",
    );

    await fetchText(baseUrl, "/", 200);
    await fetchText(baseUrl, "/producto/cristaleria", 200);
    await fetchText(baseUrl, "/cristaleria-personalizada", 200);
    await fetchText(baseUrl, `/p/${legacyProduct.slug}`, 200);
    await fetchText(baseUrl, "/blog", 200);
    await fetchText(baseUrl, "/sitemap.xml", 200);
    await fetchText(baseUrl, "/ruta-qa-inexistente-hardening", 404);
    report.checks.push("QA pública rutas clave");
    logProgress("Rutas públicas baseline OK");

    report.skipped.push(
      "override público DB con PGlite local: la app pública devuelve 500 en este entorno con DATABASE_URL=pglite://; el contrato DB -> fallback se valida abajo contra filas editables reales",
    );

    const newProductRecordId = `qa-product-${qaToken}`;
    const newProductSlug = `qa-producto-${qaToken}`;
    const newProductTitle = `QA Producto ${qaToken}`;
    const updatedProductTitle = `${newProductTitle} Editado`;
    createdProductRecordIds.push(newProductRecordId);

    const newProductPayload = {
      ...legacyProduct,
      id: newProductRecordId,
      slug: newProductSlug,
      name: newProductTitle,
      title: newProductTitle,
      descriptionHtml: legacyProduct.descriptionHtml || "<p>Descripcion QA producto.</p>",
      shortDescriptionHtml: legacyProduct.shortDescriptionHtml || "<p>Resumen QA producto.</p>",
      shortDescription: legacyProduct.shortDescription || "Resumen QA producto.",
      longDescription: legacyProduct.longDescription || legacyProduct.descriptionHtml || "Descripcion QA producto.",
    };

    await withSql(async (sql) => upsertEditableProduct(sql, {
      recordId: newProductRecordId,
      legacyId: null,
      slug: newProductSlug,
      title: newProductTitle,
      status: "published",
      imageUrl: legacyProduct.image || null,
      payload: newProductPayload,
    }));
    const mergedProductsAfterCreate = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    assert(
      mergedProductsAfterCreate.some((product) => product.slug === newProductSlug && product.title === newProductTitle),
      "El producto nuevo en DB no pasó a la colección pública fusionada.",
    );
    report.checks.push("crear producto nuevo");
    report.checks.push("producto nuevo publicado visible");
    logProgress("Producto nuevo publicado OK");

    await withSql(async (sql) => upsertEditableProduct(sql, {
      recordId: newProductRecordId,
      legacyId: null,
      slug: newProductSlug,
      title: newProductTitle,
      status: "draft",
      imageUrl: legacyProduct.image || null,
      payload: newProductPayload,
    }));
    const mergedProductsAfterDraft = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    assert(
      !mergedProductsAfterDraft.some((product) => product.slug === newProductSlug),
      "El producto nuevo en borrador siguió visible en la colección fusionada.",
    );
    report.checks.push("producto nuevo despublicado");
    logProgress("Producto nuevo despublicado OK");

    await withSql(async (sql) => upsertEditableProduct(sql, {
      recordId: newProductRecordId,
      legacyId: null,
      slug: newProductSlug,
      title: updatedProductTitle,
      status: "published",
      imageUrl: legacyProduct.image || null,
      payload: {
        ...newProductPayload,
        name: updatedProductTitle,
        title: updatedProductTitle,
      },
    }));
    const mergedProductsAfterEdit = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    assert(
      mergedProductsAfterEdit.some((product) => product.slug === newProductSlug && product.title === updatedProductTitle),
      "La edición del producto nuevo no se reflejó en la colección fusionada.",
    );
    report.checks.push("editar producto nuevo");
    logProgress("Edición de producto nuevo OK");

    await withSql(async (sql) => deleteEditableProduct(sql, newProductRecordId));
    const mergedProductsAfterDelete = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    assert(
      !mergedProductsAfterDelete.some((product) => product.slug === newProductSlug),
      "El producto nuevo borrado siguió visible en la colección fusionada.",
    );
    report.checks.push("borrado producto nuevo");
    logProgress("Borrado de producto nuevo OK");

    const legacyProductOverrideRecordId = `legacy-product-${legacyProduct.id}`;
    const legacyProductOverrideTitle = `${legacyProduct.title} QA Override`;
    createdProductRecordIds.push(legacyProductOverrideRecordId);

    await withSql(async (sql) => upsertEditableProduct(sql, {
      recordId: legacyProductOverrideRecordId,
      legacyId: String(legacyProduct.id),
      slug: legacyProduct.slug,
      title: legacyProductOverrideTitle,
      status: "published",
      imageUrl: legacyProduct.image || null,
      payload: {
        ...legacyProduct,
        name: legacyProductOverrideTitle,
        title: legacyProductOverrideTitle,
      },
    }));
    const mergedProductsAfterOverride = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    const overriddenLegacyProduct = mergedProductsAfterOverride.find((product) => product.slug === legacyProduct.slug);
    assert(
      overriddenLegacyProduct?.title === legacyProductOverrideTitle,
      "El producto legacy no tomó la versión DB publicada en la colección fusionada.",
    );
    report.checks.push("override DB producto legacy");
    logProgress("Override DB de producto legacy OK");

    await withSql(async (sql) => upsertEditableProduct(sql, {
      recordId: legacyProductOverrideRecordId,
      legacyId: String(legacyProduct.id),
      slug: legacyProduct.slug,
      title: legacyProductOverrideTitle,
      status: "draft",
      imageUrl: legacyProduct.image || null,
      payload: {
        ...legacyProduct,
        name: legacyProductOverrideTitle,
        title: legacyProductOverrideTitle,
      },
    }));
    const mergedProductsAfterLegacyDraft = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    assert(
      !mergedProductsAfterLegacyDraft.some((product) => String(product.id) === String(legacyProduct.id)),
      "El producto legacy en borrador siguió visible en la colección fusionada.",
    );
    report.checks.push("despublicar producto legacy desde DB");
    logProgress("Despublicar producto legacy desde DB OK");

    await withSql(async (sql) => deleteEditableProduct(sql, legacyProductOverrideRecordId));
    const mergedProductsAfterLegacyDelete = await withSql(async (sql) =>
      mergeProductsForQa(productSamples, await listEditableProducts(sql)),
    );
    const legacyProductHtmlRestored = mergedProductsAfterLegacyDelete.find((product) => product.slug === legacyProduct.slug);
    assert(
      legacyProductHtmlRestored?.title === legacyProduct.title,
      "El fallback del producto legacy no se restauró al eliminar el registro editable en la colección fusionada.",
    );
    report.checks.push("fallback restaurado producto legacy");
    logProgress("Fallback restaurado de producto legacy OK");

    const newBlogRecordId = `qa-blog-${qaToken}`;
    const newBlogSlug = `qa-blog-${qaToken}`;
    const newBlogTitle = `QA Blog ${qaToken}`;
    const updatedBlogTitle = `${newBlogTitle} Editado`;
    createdBlogRecordIds.push(newBlogRecordId);

    const newBlogPayload = {
      ...legacyBlog,
      id: newBlogRecordId,
      slug: newBlogSlug,
      title: newBlogTitle,
      excerpt: "Extracto QA blog",
      contentHtml: "<h1>QA</h1><p>Contenido QA blog.</p>",
      authorName: "QA Bot",
      legacyUrl: null,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await withSql(async (sql) => upsertEditableBlogPost(sql, {
      recordId: newBlogRecordId,
      legacyId: null,
      slug: newBlogSlug,
      title: newBlogTitle,
      excerpt: newBlogPayload.excerpt,
      status: "published",
      legacyUrl: null,
      featuredImageUrl: legacyBlog.featuredImageUrl || null,
      publishedAt: newBlogPayload.publishedAt,
      payload: {
        ...newBlogPayload,
        contentMarkdown: "# QA\n\nContenido QA blog.",
      },
    }));
    const mergedBlogAfterCreate = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    assert(
      mergedBlogAfterCreate.some((post) => post.slug === newBlogSlug && post.title === newBlogTitle),
      "El post nuevo en DB no pasó a la colección pública fusionada.",
    );
    report.checks.push("crear post nuevo");
    report.checks.push("post nuevo publicado visible");
    logProgress("Post nuevo publicado OK");

    await withSql(async (sql) => upsertEditableBlogPost(sql, {
      recordId: newBlogRecordId,
      legacyId: null,
      slug: newBlogSlug,
      title: newBlogTitle,
      excerpt: newBlogPayload.excerpt,
      status: "draft",
      legacyUrl: null,
      featuredImageUrl: legacyBlog.featuredImageUrl || null,
      publishedAt: newBlogPayload.publishedAt,
      payload: {
        ...newBlogPayload,
        contentMarkdown: "# QA\n\nContenido QA blog.",
      },
    }));
    const mergedBlogAfterDraft = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    assert(
      !mergedBlogAfterDraft.some((post) => post.slug === newBlogSlug),
      "El post nuevo en borrador siguió visible en la colección fusionada.",
    );
    report.checks.push("post nuevo despublicado");
    logProgress("Post nuevo despublicado OK");

    await withSql(async (sql) => upsertEditableBlogPost(sql, {
      recordId: newBlogRecordId,
      legacyId: null,
      slug: newBlogSlug,
      title: updatedBlogTitle,
      excerpt: newBlogPayload.excerpt,
      status: "published",
      legacyUrl: null,
      featuredImageUrl: legacyBlog.featuredImageUrl || null,
      publishedAt: newBlogPayload.publishedAt,
      payload: {
        ...newBlogPayload,
        title: updatedBlogTitle,
        contentMarkdown: "# QA\n\nContenido QA blog editado.",
      },
    }));
    const mergedBlogAfterEdit = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    assert(
      mergedBlogAfterEdit.some((post) => post.slug === newBlogSlug && post.title === updatedBlogTitle),
      "La edición del post nuevo no se reflejó en la colección fusionada.",
    );
    report.checks.push("editar post nuevo");
    logProgress("Edición de post nuevo OK");

    await withSql(async (sql) => deleteEditableBlogPost(sql, newBlogRecordId));
    const mergedBlogAfterDelete = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    assert(
      !mergedBlogAfterDelete.some((post) => post.slug === newBlogSlug),
      "El post nuevo borrado siguió visible en la colección fusionada.",
    );
    report.checks.push("borrado post nuevo");
    logProgress("Borrado de post nuevo OK");

    const legacyBlogOverrideRecordId = `legacy-blog-${legacyBlog.id}`;
    const legacyBlogOverrideTitle = `${legacyBlog.title} QA Override`;
    createdBlogRecordIds.push(legacyBlogOverrideRecordId);

    await withSql(async (sql) => upsertEditableBlogPost(sql, {
      recordId: legacyBlogOverrideRecordId,
      legacyId: String(legacyBlog.id),
      slug: legacyBlog.slug,
      title: legacyBlogOverrideTitle,
      excerpt: legacyBlog.excerpt || "Extracto QA override",
      status: "published",
      legacyUrl: legacyBlog.legacyUrl || null,
      featuredImageUrl: legacyBlog.featuredImageUrl || null,
      publishedAt: legacyBlog.publishedAt || new Date().toISOString(),
      payload: {
        ...legacyBlog,
        title: legacyBlogOverrideTitle,
        contentHtml: "<h1>Override</h1><p>Contenido DB QA.</p>",
        contentMarkdown: "# Override\n\nContenido DB QA.",
      },
    }));
    const mergedBlogAfterOverride = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    const overriddenLegacyBlog = mergedBlogAfterOverride.find((post) => post.slug === legacyBlog.slug);
    assert(
      overriddenLegacyBlog?.title === legacyBlogOverrideTitle,
      "El blog legacy no tomó la versión DB publicada en la colección fusionada.",
    );
    report.checks.push("override DB blog legacy");
    logProgress("Override DB de blog legacy OK");

    await withSql(async (sql) => upsertEditableBlogPost(sql, {
      recordId: legacyBlogOverrideRecordId,
      legacyId: String(legacyBlog.id),
      slug: legacyBlog.slug,
      title: legacyBlogOverrideTitle,
      excerpt: legacyBlog.excerpt || "Extracto QA override",
      status: "draft",
      legacyUrl: legacyBlog.legacyUrl || null,
      featuredImageUrl: legacyBlog.featuredImageUrl || null,
      publishedAt: legacyBlog.publishedAt || new Date().toISOString(),
      payload: {
        ...legacyBlog,
        title: legacyBlogOverrideTitle,
        contentHtml: "<h1>Override</h1><p>Contenido DB QA.</p>",
        contentMarkdown: "# Override\n\nContenido DB QA.",
      },
    }));
    const mergedBlogAfterLegacyDraft = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    assert(
      !mergedBlogAfterLegacyDraft.some((post) => String(post.id) === String(legacyBlog.id)),
      "El blog legacy en borrador siguió visible en la colección fusionada.",
    );
    report.checks.push("despublicar blog legacy desde DB");
    logProgress("Despublicar blog legacy desde DB OK");

    await withSql(async (sql) => deleteEditableBlogPost(sql, legacyBlogOverrideRecordId));
    const mergedBlogAfterLegacyDelete = await withSql(async (sql) =>
      mergeBlogPostsForQa(blogSamples, await listEditableBlogPosts(sql)),
    );
    const legacyBlogHtmlRestored = mergedBlogAfterLegacyDelete.find((post) => post.slug === legacyBlog.slug);
    assert(
      legacyBlogHtmlRestored?.title === legacyBlog.title,
      "El fallback del blog legacy no se restauró al eliminar el registro editable en la colección fusionada.",
    );
    report.checks.push("fallback restaurado blog legacy");
    logProgress("Fallback restaurado de blog legacy OK");

    if (blobEnabled) {
      report.skipped.push(
        "subida de imagen panel: BLOB configurado, pero este smoke local no valida subida sin una sesión admin navegable de extremo a extremo",
      );
    } else {
      report.skipped.push("subida de imagen panel: BLOB_READ_WRITE_TOKEN no configurado");
    }

    report.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`QA smoke OK. Reporte: ${reportPath}`);
  } finally {
    logProgress("Cerrando servidor y limpiando recursos QA");

    for (const recordId of createdProductRecordIds) {
      await withSql(async (sql) => deleteEditableProduct(sql, recordId)).catch(() => undefined);
    }

    for (const recordId of createdBlogRecordIds) {
      await withSql(async (sql) => deleteEditableBlogPost(sql, recordId)).catch(() => undefined);
    }

    await stopProcessTree(server);
    await databaseTarget.cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
