import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const args = process.argv.slice(2);

const CATEGORY_LABELS = {
  "cristaleria-personalizada": "Cristalería Personalizada",
  "vajilla-personalizada": "Vajilla Personalizada",
  "servilletas-personalizadas": "Servilletas Personalizadas",
  "cuberteria-personalizada": "Cubertería Personalizada",
  "copas-de-vino-personalizadas": "Copas de Vino Personalizadas",
  "cristaleria-cerveza-personalizada": "Cristalería Cerveza Personalizada",
  "vasos-combinados-botellas-cava": "Vasos Combinados Botellas Cava",
  "tazas-y-platillos-personalizados": "Tazas y Platillos Personalizados",
  "platos-personalizados": "Platos Personalizados",
  "fuentes-ensaladeras-personalizadas": "Fuentes Ensaladeras Personalizadas",
  "platos-de-pizza-personalizados": "Platos de Pizza Personalizados",
  "manteles-caminos-personalizados": "Manteles Caminos Personalizados",
  "servilletas-bar-cocktail-personalizadas": "Servilletas Bar Cocktail Personalizadas",
  "servilletas-de-mesa-personalizadas": "Servilletas de Mesa Personalizadas",
};

const MEDIA_CACHE_PATH = path.join(cwd, "out", "wp-headless-media-cache.json");
const DEFAULT_REPORT_PATH = path.join(cwd, "out", "wp-headless-import-report.json");

function hasFlag(flag) {
  return args.includes(flag);
}

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }

  return value;
}

const options = {
  dryRun: hasFlag("--dry-run"),
  skipImages: hasFlag("--skip-images"),
  refreshMediaCache: hasFlag("--refresh-media-cache"),
  limit: Number(getArgValue("--limit") || 0),
  productId: getArgValue("--product-id"),
  productSlug: getArgValue("--product-slug"),
  reportPath: path.resolve(cwd, getArgValue("--report") || DEFAULT_REPORT_PATH),
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function detectDelimiter(headerLine) {
  const commas = (headerLine.match(/,/g) || []).length;
  const semicolons = (headerLine.match(/;/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsvLine(line, delimiter) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function slugFromPath(raw) {
  return String(raw || "").trim().replace(/^\/+|\/+$/g, "");
}

function pathFromSlug(slug) {
  return slug ? `/${slug}` : "/";
}

function titleFromSlug(slug) {
  if (CATEGORY_LABELS[slug]) {
    return CATEGORY_LABELS[slug];
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toFrontendProductPath(legacyId, frontendSlug) {
  return `/p${legacyId}-${frontendSlug}.html`;
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toPrice(product) {
  if (typeof product.price === "number" && product.price > 0) {
    return product.price.toFixed(2);
  }

  const optionPrice = Array.isArray(product.options)
    ? product.options.find((option) => Number(option.effectivePrice || option.price || 0) > 0)
    : null;

  if (optionPrice) {
    return Number(optionPrice.effectivePrice || optionPrice.price || 0).toFixed(2);
  }

  return "";
}

function hashPayload(payload) {
  return crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

function readVisibilityRows() {
  const csvPath = path.join(cwd, "data", "visibility", "products.csv");
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const indexes = {
    category: headers.findIndex((value) => value.toLowerCase() === "categoria"),
    subCategory: headers.findIndex((value) => value.toLowerCase() === "sub categories"),
    frontendSlug: headers.findIndex((value) => value.toLowerCase() === "slug"),
    legacyId: headers.findIndex((value) => value.toLowerCase() === "id"),
    title: headers.findIndex((value) => value.toLowerCase() === "title"),
    legacyUrl: headers.findIndex((value) => value.toLowerCase() === "legacy url"),
    images: headers.findIndex((value) => value.toLowerCase() === "images"),
  };

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const imagesRaw = indexes.images >= 0 ? values[indexes.images] || "" : "";

    return {
      categorySlug: slugFromPath(indexes.category >= 0 ? values[indexes.category] || "" : ""),
      subCategorySlug: slugFromPath(indexes.subCategory >= 0 ? values[indexes.subCategory] || "" : ""),
      frontendSlug: String(indexes.frontendSlug >= 0 ? values[indexes.frontendSlug] || "" : "").trim(),
      legacyId: String(indexes.legacyId >= 0 ? values[indexes.legacyId] || "" : "").trim(),
      title: String(indexes.title >= 0 ? values[indexes.title] || "" : "").trim(),
      legacyUrl: String(indexes.legacyUrl >= 0 ? values[indexes.legacyUrl] || "" : "").trim(),
      images: imagesRaw.split("|").map((image) => image.trim()).filter(Boolean),
    };
  }).filter((row) => row.legacyId);
}

function resolveLocalImagePath(imagePath) {
  const clean = String(imagePath || "").trim();
  if (!clean.startsWith("/")) {
    return null;
  }

  const absolutePath = path.join(cwd, "public", clean.replace(/^\/+/, "").replace(/\//g, path.sep));
  return fs.existsSync(absolutePath) ? absolutePath : null;
}

function loadMediaCache() {
  if (options.refreshMediaCache || !fs.existsSync(MEDIA_CACHE_PATH)) {
    return {};
  }

  try {
    return readJson(MEDIA_CACHE_PATH);
  } catch {
    return {};
  }
}

function saveMediaCache(cache) {
  ensureDir(MEDIA_CACHE_PATH);
  fs.writeFileSync(MEDIA_CACHE_PATH, JSON.stringify(cache, null, 2));
}

function buildCatalogRecords() {
  const products = readJson(path.join(cwd, "lib", "data", "products.json"));
  const visibilityRows = readVisibilityRows();
  const visibilityById = new Map(visibilityRows.map((row) => [row.legacyId, row]));
  const conflicts = [];

  const records = products.map((product) => {
    const legacyId = String(product.id || "").trim();
    const visibility = visibilityById.get(legacyId);
    const frontendSlug =
      String(visibility?.frontendSlug || "").trim()
      || String(product.slug || "").replace(new RegExp(`-${legacyId}$`), "");
    const frontendPath = toFrontendProductPath(legacyId, frontendSlug);
    const categoryPath = visibility?.categorySlug ? [visibility.categorySlug] : [];
    const categoryPaths = [];

    if (categoryPath.length > 0) {
      categoryPaths.push(categoryPath);
    }

    if (visibility?.categorySlug && visibility?.subCategorySlug) {
      categoryPaths.push([visibility.categorySlug, visibility.subCategorySlug]);
    }

    if (categoryPaths.length === 0 && Array.isArray(product.categoryPaths)) {
      for (const rawPath of product.categoryPaths) {
        const normalized = Array.isArray(rawPath)
          ? rawPath.map((segment) => slugFromPath(segment)).filter(Boolean)
          : [];
        if (normalized.length > 0) {
          categoryPaths.push(normalized);
        }
      }
    }

    const imageCandidates = [
      ...(Array.isArray(product.images) ? product.images : []),
      ...(Array.isArray(product.imagesSource) ? product.imagesSource : []),
      ...(visibility?.images || []),
    ].map((image) => String(image || "").trim()).filter(Boolean);

    const images = Array.from(new Set(imageCandidates));
    const metaPayload = {
      legacyId,
      frontendSlug,
      frontendPath,
      dataSlug: String(product.slug || "").trim(),
      categoryPaths,
      options: Array.isArray(product.options) ? product.options : [],
      features: Array.isArray(product.features) ? product.features : [],
      personalizationsRaw: String(product.personalizationsRaw || "").trim(),
      personalizations: Array.isArray(product.personalizations) ? product.personalizations : [],
      brand: String(product.brand || "").trim(),
      variantName: String(product.variantName || "").trim(),
      marketingLabel: String(product.marketingLabel || "").trim(),
    };

    if (!frontendSlug) {
      conflicts.push({
        type: "missing_frontend_slug",
        legacyId,
        title: product.name,
      });
    }

    if (categoryPaths.length === 0) {
      conflicts.push({
        type: "missing_category_mapping",
        legacyId,
        title: product.name,
      });
    }

    return {
      legacyId,
      wooSlug: frontendSlug || String(product.slug || ""),
      frontendSlug,
      frontendPath,
      dataSlug: String(product.slug || "").trim(),
      legacyUrl: String(visibility?.legacyUrl || "").trim() || frontendPath,
      title: String(product.name || product.title || "").trim(),
      descriptionHtml: String(product.descriptionHtml || "").trim(),
      shortDescriptionHtml: String(product.shortDescriptionHtml || "").trim(),
      shortDescription: String(product.shortDescription || "").trim() || stripHtml(product.shortDescriptionHtml || product.descriptionHtml || ""),
      regularPrice: toPrice(product),
      categoryPaths,
      images,
      payload: product,
      metaPayload,
      sourceHash: hashPayload({
        title: product.name,
        descriptionHtml: product.descriptionHtml,
        shortDescriptionHtml: product.shortDescriptionHtml,
        price: toPrice(product),
        categoryPaths,
        frontendSlug,
        images,
        metaPayload,
      }),
    };
  });

  let filtered = records;
  if (options.productId) {
    filtered = filtered.filter((record) => record.legacyId === options.productId);
  }
  if (options.productSlug) {
    filtered = filtered.filter((record) => record.wooSlug === options.productSlug || record.frontendSlug === options.productSlug);
  }
  if (options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return { records: filtered, conflicts };
}

class WooClient {
  constructor() {
    this.baseUrl = String(process.env.WP_BASE_URL || "").trim().replace(/\/+$/g, "");
    this.consumerKey = String(process.env.WC_CONSUMER_KEY || "").trim();
    this.consumerSecret = String(process.env.WC_CONSUMER_SECRET || "").trim();
  }

  isConfigured() {
    return Boolean(this.baseUrl && this.consumerKey && this.consumerSecret);
  }

  authHeader() {
    return `Basic ${Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64")}`;
  }

  async request(method, endpoint, { searchParams, body, extraHeaders } = {}) {
    const url = new URL(`${this.baseUrl}/wp-json/wc/v3/${endpoint}`);
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
        ...(extraHeaders || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Woo ${method} ${endpoint} -> ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async listAll(endpoint) {
    const items = [];
    let page = 1;

    while (true) {
      const batch = await this.request("GET", endpoint, {
        searchParams: {
          page,
          per_page: 100,
          context: "edit",
        },
      });

      items.push(...batch);
      if (batch.length < 100) {
        break;
      }
      page += 1;
    }

    return items;
  }
}

class WordPressMediaClient {
  constructor() {
    this.baseUrl = String(process.env.WP_BASE_URL || "").trim().replace(/\/+$/g, "");
    this.user = String(process.env.WP_APP_USER || "").trim();
    this.password = String(process.env.WP_APP_PASSWORD || "").trim();
    this.sourceSiteUrl = String(process.env.HEADLESS_SOURCE_SITE_URL || "").trim().replace(/\/+$/g, "");
  }

  canUpload() {
    return Boolean(this.baseUrl && this.user && this.password);
  }

  authHeader() {
    return `Basic ${Buffer.from(`${this.user}:${this.password}`).toString("base64")}`;
  }

  async uploadFile(absolutePath, fileName) {
    const buffer = fs.readFileSync(absolutePath);
    const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": contentTypeFromName(fileName),
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WP media upload -> ${response.status}: ${text}`);
    }

    return response.json();
  }
}

function contentTypeFromName(fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

async function ensureCategories(wooClient, records, report) {
  const existing = await wooClient.listAll("products/categories");
  const categoriesBySlug = new Map();
  for (const category of existing) {
    categoriesBySlug.set(String(category.slug || "").trim(), category);
  }

  const categoryIdBySlug = new Map();

  async function ensureCategory(slug, parentSlug) {
    if (!slug) {
      return null;
    }

    if (categoryIdBySlug.has(slug)) {
      return categoryIdBySlug.get(slug);
    }

    let existingCategory = categoriesBySlug.get(slug);
    const parentId = parentSlug ? await ensureCategory(parentSlug, null) : 0;

    if (!existingCategory) {
      const created = await wooClient.request("POST", "products/categories", {
        body: {
          name: titleFromSlug(slug),
          slug,
          parent: parentId || 0,
          meta_data: [
            { key: "ph_frontend_slug", value: slug },
            { key: "ph_frontend_path", value: pathFromSlug(slug) },
            { key: "ph_parent_frontend_slug", value: parentSlug || "" },
          ],
        },
      });
      existingCategory = created;
      categoriesBySlug.set(slug, created);
      report.categories.created += 1;
    } else {
      report.categories.reused += 1;
    }

    categoryIdBySlug.set(slug, Number(existingCategory.id));
    return Number(existingCategory.id);
  }

  for (const record of records) {
    for (const categoryPath of record.categoryPaths) {
      let parentSlug = null;
      for (const slug of categoryPath) {
        await ensureCategory(slug, parentSlug);
        parentSlug = slug;
      }
    }
  }

  return categoryIdBySlug;
}

async function resolveProductImages(mediaClient, mediaCache, record, report) {
  if (options.skipImages) {
    return [];
  }

  const images = [];

  for (const imagePath of record.images) {
    const absolutePath = resolveLocalImagePath(imagePath);
    if (!absolutePath) {
      report.conflicts.push({
        type: "missing_image_file",
        legacyId: record.legacyId,
        imagePath,
      });

      if (mediaClient.sourceSiteUrl) {
        images.push({ src: `${mediaClient.sourceSiteUrl}${imagePath}` });
      }
      continue;
    }

    const fileStat = fs.statSync(absolutePath);
    const cacheKey = `${imagePath}:${fileStat.size}:${fileStat.mtimeMs}`;
    const cached = mediaCache[cacheKey];
    if (cached?.id) {
      images.push({ id: Number(cached.id) });
      report.images.reused += 1;
      continue;
    }

    if (!mediaClient.canUpload()) {
      if (mediaClient.sourceSiteUrl) {
        images.push({ src: `${mediaClient.sourceSiteUrl}${imagePath}` });
        report.images.external += 1;
      } else {
        report.conflicts.push({
          type: "missing_wp_media_credentials",
          legacyId: record.legacyId,
          imagePath,
        });
      }
      continue;
    }

    const uploaded = await mediaClient.uploadFile(absolutePath, path.basename(absolutePath));
    mediaCache[cacheKey] = {
      id: uploaded.id,
      source_url: uploaded.source_url,
      path: imagePath,
    };
    images.push({ id: Number(uploaded.id) });
    report.images.uploaded += 1;
  }

  return images;
}

async function findExistingProduct(wooClient, record) {
  const bySku = await wooClient.request("GET", "products", {
    searchParams: {
      sku: record.legacyId,
      context: "edit",
      per_page: 100,
    },
  });

  if (Array.isArray(bySku) && bySku.length > 0) {
    return bySku[0];
  }

  const bySlug = await wooClient.request("GET", "products", {
    searchParams: {
      slug: record.wooSlug,
      context: "edit",
      per_page: 100,
    },
  });

  return Array.isArray(bySlug) && bySlug.length > 0 ? bySlug[0] : null;
}

function buildProductPayload(record, categoryIdBySlug, images) {
  const categoryIds = new Set();
  for (const categoryPath of record.categoryPaths) {
    for (const slug of categoryPath) {
      const categoryId = categoryIdBySlug.get(slug);
      if (categoryId) {
        categoryIds.add(categoryId);
      }
    }
  }

  return {
    name: record.title,
    slug: record.wooSlug,
    type: "simple",
    status: "publish",
    catalog_visibility: "visible",
    description: record.descriptionHtml,
    short_description: record.shortDescriptionHtml || record.shortDescription,
    regular_price: record.regularPrice,
    sku: record.legacyId,
    categories: Array.from(categoryIds).map((id) => ({ id })),
    images,
    meta_data: [
      { key: "ph_legacy_id", value: record.legacyId },
      { key: "ph_frontend_slug", value: record.frontendSlug },
      { key: "ph_frontend_path", value: record.frontendPath },
      { key: "ph_data_slug", value: record.dataSlug },
      { key: "ph_category_paths", value: JSON.stringify(record.categoryPaths) },
      { key: "ph_option_tiers", value: JSON.stringify(record.metaPayload.options) },
      { key: "ph_features", value: JSON.stringify(record.metaPayload.features) },
      { key: "ph_personalizations", value: JSON.stringify(record.metaPayload.personalizations) },
      { key: "ph_personalizations_raw", value: record.metaPayload.personalizationsRaw },
      { key: "ph_brand", value: record.metaPayload.brand },
      { key: "ph_variant_name", value: record.metaPayload.variantName },
      { key: "ph_marketing_label", value: record.metaPayload.marketingLabel },
      { key: "ph_source_hash", value: record.sourceHash },
      { key: "ph_legacy_url", value: record.legacyUrl },
    ],
  };
}

async function runDryRun(report, records) {
  report.summary.mode = "dry-run";
  report.summary.productsSelected = records.length;
  ensureDir(options.reportPath);
  fs.writeFileSync(options.reportPath, JSON.stringify(report, null, 2));
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    summary: {
      mode: options.dryRun ? "dry-run" : "import",
      productsSelected: 0,
    },
    categories: {
      created: 0,
      reused: 0,
    },
    products: {
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
    },
    images: {
      uploaded: 0,
      reused: 0,
      external: 0,
    },
    conflicts: [],
    items: [],
  };

  const { records, conflicts } = buildCatalogRecords();
  report.conflicts.push(...conflicts);
  report.summary.productsSelected = records.length;

  if (options.dryRun) {
    report.items = records.map((record) => ({
      legacyId: record.legacyId,
      title: record.title,
      wooSlug: record.wooSlug,
      frontendPath: record.frontendPath,
      categoryPaths: record.categoryPaths,
      images: record.images,
      sourceHash: record.sourceHash,
    }));
    await runDryRun(report, records);
    return;
  }

  const wooClient = new WooClient();
  if (!wooClient.isConfigured()) {
    throw new Error("Faltan WP_BASE_URL, WC_CONSUMER_KEY o WC_CONSUMER_SECRET para importar en WooCommerce.");
  }

  const mediaClient = new WordPressMediaClient();
  const mediaCache = loadMediaCache();
  const categoryIdBySlug = await ensureCategories(wooClient, records, report);

  for (const record of records) {
    try {
      const existing = await findExistingProduct(wooClient, record);
      const images = await resolveProductImages(mediaClient, mediaCache, record, report);
      const payload = buildProductPayload(record, categoryIdBySlug, images);

      if (!record.wooSlug) {
        report.products.skipped += 1;
        report.conflicts.push({
          type: "missing_woo_slug",
          legacyId: record.legacyId,
          title: record.title,
        });
        continue;
      }

      if (existing) {
        await wooClient.request("PUT", `products/${existing.id}`, { body: payload });
        report.products.updated += 1;
        report.items.push({
          legacyId: record.legacyId,
          wooProductId: existing.id,
          action: "updated",
          title: record.title,
          frontendPath: record.frontendPath,
        });
      } else {
        const created = await wooClient.request("POST", "products", { body: payload });
        report.products.created += 1;
        report.items.push({
          legacyId: record.legacyId,
          wooProductId: created.id,
          action: "created",
          title: record.title,
          frontendPath: record.frontendPath,
        });
      }
    } catch (error) {
      report.products.failed += 1;
      report.conflicts.push({
        type: "product_import_failed",
        legacyId: record.legacyId,
        title: record.title,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  saveMediaCache(mediaCache);
  report.finishedAt = new Date().toISOString();
  ensureDir(options.reportPath);
  fs.writeFileSync(options.reportPath, JSON.stringify(report, null, 2));
  console.log(`Importación completada. Reporte: ${options.reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
