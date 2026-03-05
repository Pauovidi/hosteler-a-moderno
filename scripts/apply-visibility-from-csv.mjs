#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_CSV_PATH = path.join(ROOT, "data/visibility/blog.csv");
const PRODUCTS_CSV_PATH = path.join(ROOT, "data/visibility/products.csv");
const BLOG_JSON_PATH = path.join(ROOT, "lib/data/visibility-blog.json");
const PRODUCTS_JSON_PATH = path.join(ROOT, "lib/data/visibility-products.json");
const REPORT_PATH = path.join(ROOT, "out/visibility-report.json");
const PRODUCTS_DATA_PATH = path.join(ROOT, "lib/data/products.json");
const BLOG_DATA_PATH = path.join(ROOT, "lib/data/generated-blog.json");

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

async function readCsv(filePath, delimiter) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`No se encontró el CSV requerido: ${path.relative(ROOT, filePath)}`);
  }

  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const rows = parseDelimited(text, delimiter).filter((r) => r.some((v) => String(v || "").trim()));

  if (rows.length === 0) {
    throw new Error(`El CSV está vacío: ${path.relative(ROOT, filePath)}`);
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const dataRows = rows.slice(1).map((cols) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = String(cols[index] || "").trim();
    });
    return entry;
  });

  return { headers, rows: dataRows };
}

function slugFromLegacyUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return lastSegment.replace(/\.html?$/i, "").replace(/^p\d+-/i, "");
  } catch {
    const lastSegment = value.split("/").filter(Boolean).pop() || "";
    return lastSegment.replace(/\.html?$/i, "").replace(/^p\d+-/i, "");
  }
}

function normalizeId(value) {
  return String(value || "").trim();
}

async function readJsonArray(filePath) {
  try {
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function main() {
  const notes = [];

  const blogCsv = await readCsv(BLOG_CSV_PATH, ",");
  const blogUrlColumn = "Páginas principales";
  const blogActionColumn = "Acción";

  if (!blogCsv.headers.includes(blogUrlColumn) || !blogCsv.headers.includes(blogActionColumn)) {
    if (!blogCsv.headers.includes(blogUrlColumn)) notes.push(`Falta columna en blog.csv: ${blogUrlColumn}`);
    if (!blogCsv.headers.includes(blogActionColumn)) notes.push(`Falta columna en blog.csv: ${blogActionColumn}`);
  }

  const hiddenLegacyUrls = [];
  for (const row of blogCsv.rows) {
    const url = String(row[blogUrlColumn] || "").trim();
    const action = String(row[blogActionColumn] || "").trim();
    if (url && /^eliminar/i.test(action)) {
      hiddenLegacyUrls.push(url);
    }
  }

  const productsCsv = await readCsv(PRODUCTS_CSV_PATH, ";");
  const idColumn = "ID";
  const removeColumn = "QUITAR o eliminar";

  if (!productsCsv.headers.includes(idColumn) || !productsCsv.headers.includes(removeColumn)) {
    if (!productsCsv.headers.includes(idColumn)) notes.push(`Falta columna en products.csv: ${idColumn}`);
    if (!productsCsv.headers.includes(removeColumn)) notes.push(`Falta columna en products.csv: ${removeColumn}`);
  }

  const allowedSet = new Set();
  const hiddenSet = new Set();

  for (const row of productsCsv.rows) {
    const id = normalizeId(row[idColumn]);
    if (!id) continue;

    allowedSet.add(id);

    const removeRaw = String(row[removeColumn] || "").trim();
    if (/^x$/i.test(removeRaw)) {
      hiddenSet.add(id);
    }
  }

  const allowedProductIds = Array.from(allowedSet).sort();
  const hiddenProductIds = Array.from(hiddenSet).sort();

  await fs.mkdir(path.dirname(BLOG_JSON_PATH), { recursive: true });
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

  await fs.writeFile(BLOG_JSON_PATH, `${JSON.stringify({ hiddenLegacyUrls }, null, 2)}\n`, "utf8");
  await fs.writeFile(PRODUCTS_JSON_PATH, `${JSON.stringify({ allowedProductIds, hiddenProductIds }, null, 2)}\n`, "utf8");

  const allProductsData = await readJsonArray(PRODUCTS_DATA_PATH);
  const allProductIds = new Set(allProductsData.map((p) => normalizeId(p?.id)).filter(Boolean));
  const allowedNotFoundInCatalog = allowedProductIds.filter((id) => !allProductIds.has(id));
  const hiddenNotFoundInCatalog = hiddenProductIds.filter((id) => !allProductIds.has(id));

  const blogData = await readJsonArray(BLOG_DATA_PATH);
  const blogSlugs = new Set(blogData.map((post) => String(post?.slug || "").trim()).filter(Boolean));
  const hiddenBlogSlugs = hiddenLegacyUrls.map(slugFromLegacyUrl).filter(Boolean);
  const hiddenBlogSlugsNotFound = hiddenBlogSlugs.filter((slug) => !blogSlugs.has(slug));

  const report = {
    counts: {
      blogHidden: hiddenLegacyUrls.length,
      blogTotalRows: blogCsv.rows.length,
      productsAllowedCount: allowedProductIds.length,
      productsHiddenCount: hiddenProductIds.length,
    },
    examples: {
      hiddenLegacyUrls: hiddenLegacyUrls.slice(0, 5),
      allowedProductIds: allowedProductIds.slice(0, 5),
      hiddenProductIds: hiddenProductIds.slice(0, 5),
    },
    idsNotFound: {
      allowedNotFoundInCatalog: allowedNotFoundInCatalog.slice(0, 50),
      hiddenNotFoundInCatalog: hiddenNotFoundInCatalog.slice(0, 50),
      hiddenBlogSlugsNotFound: hiddenBlogSlugsNotFound.slice(0, 50),
    },
    notes,
  };

  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Visibilidad generada correctamente.");
  console.log(`- ${path.relative(ROOT, BLOG_JSON_PATH)}`);
  console.log(`- ${path.relative(ROOT, PRODUCTS_JSON_PATH)}`);
  console.log(`- ${path.relative(ROOT, REPORT_PATH)}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
