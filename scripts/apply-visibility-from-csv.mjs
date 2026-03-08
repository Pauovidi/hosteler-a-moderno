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
const DELIMITER_CANDIDATES = [",", ";", "\t"];

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

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function countDelimiterOutsideQuotes(line, delimiter) {
  let count = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      count += 1;
    }
  }

  return count;
}

function detectDelimiter(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!lines.length) return ",";

  const scores = DELIMITER_CANDIDATES.map((delimiter) => ({
    delimiter,
    score: lines.reduce((acc, line) => acc + countDelimiterOutsideQuotes(line, delimiter), 0),
  }));

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].delimiter : ",";
}

function findHeader(headers, wantedAliases) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const alias of wantedAliases) {
    const wanted = normalizeHeader(alias);
    const exact = normalizedHeaders.find((h) => h.normalized === wanted);
    if (exact) return exact.original;
  }

  for (const alias of wantedAliases) {
    const wanted = normalizeHeader(alias);
    const fuzzy = normalizedHeaders.find((h) => h.normalized.includes(wanted) || wanted.includes(h.normalized));
    if (fuzzy) return fuzzy.original;
  }

  return null;
}

async function readCsv(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`No se encontro el CSV requerido: ${path.relative(ROOT, filePath)}`);
  }

  const text = stripBom(raw);
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter).filter((r) => r.some((v) => String(v || "").trim()));

  if (rows.length === 0) {
    throw new Error(`El CSV esta vacio: ${path.relative(ROOT, filePath)}`);
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const dataRows = rows.slice(1).map((cols, rowIndex) => {
    const entry = {};
    headers.forEach((header, colIndex) => {
      entry[header] = String(cols[colIndex] || "").trim();
    });
    return { rowNumber: rowIndex + 2, values: entry };
  });

  return { headers, rows: dataRows, delimiter };
}

function slugFromLegacyUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return lastSegment.replace(/\.html?$/i, "").replace(/^[pc]\d+-/i, "");
  } catch {
    const safe = value.split("#")[0].split("?")[0];
    const lastSegment = safe.split("/").filter(Boolean).pop() || "";
    return lastSegment.replace(/\.html?$/i, "").replace(/^[pc]\d+-/i, "");
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
  const problematicRows = [];

  const blogCsv = await readCsv(BLOG_CSV_PATH);
  const blogUrlColumn = findHeader(blogCsv.headers, ["Paginas principales", "Pagina principal", "URL", "Legacy URL"]);
  const blogActionColumn = findHeader(blogCsv.headers, ["Accion", "Accion de visibilidad"]);

  if (!blogUrlColumn || !blogActionColumn) {
    if (!blogUrlColumn) notes.push("No se encontro una columna de URL legacy en blog.csv.");
    if (!blogActionColumn) notes.push("No se encontro una columna de accion en blog.csv.");
  }

  const hiddenLegacyUrlSet = new Set();
  for (const row of blogCsv.rows) {
    const url = blogUrlColumn ? String(row.values[blogUrlColumn] || "").trim() : "";
    const action = blogActionColumn ? String(row.values[blogActionColumn] || "").trim() : "";

    if (url && /^eliminar/i.test(action)) {
      hiddenLegacyUrlSet.add(url);
    } else if (/^eliminar/i.test(action) && !url) {
      problematicRows.push({
        file: "blog.csv",
        rowNumber: row.rowNumber,
        reason: "Accion ELIMINAR sin URL de pagina principal.",
      });
    }
  }

  const hiddenLegacyUrls = Array.from(hiddenLegacyUrlSet).sort();

  const productsCsv = await readCsv(PRODUCTS_CSV_PATH);
  const idColumn = findHeader(productsCsv.headers, ["ID"]);
  const removeColumn = findHeader(productsCsv.headers, ["QUITAR o eliminar", "Quitar o eliminar", "Quitar", "Eliminar"]);

  if (!idColumn) {
    notes.push("No se encontro una columna ID en products.csv.");
  }
  if (!removeColumn) {
    notes.push("No se encontro la columna opcional 'QUITAR o eliminar' en products.csv; no se aplicara ocultacion por X.");
  }

  const allowedSet = new Set();
  const hiddenSet = new Set();

  for (const row of productsCsv.rows) {
    const id = idColumn ? normalizeId(row.values[idColumn]) : "";
    if (!id) {
      problematicRows.push({
        file: "products.csv",
        rowNumber: row.rowNumber,
        reason: "Fila sin ID de producto.",
      });
      continue;
    }

    allowedSet.add(id);

    const removeRaw = removeColumn ? String(row.values[removeColumn] || "").trim() : "";
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
    files: {
      blogCsv: path.relative(ROOT, BLOG_CSV_PATH),
      productsCsv: path.relative(ROOT, PRODUCTS_CSV_PATH),
      blogDelimiter: blogCsv.delimiter,
      productsDelimiter: productsCsv.delimiter,
    },
    columnsDetected: {
      blog: {
        url: blogUrlColumn,
        action: blogActionColumn,
      },
      products: {
        id: idColumn,
        remove: removeColumn,
      },
    },
    counts: {
      blogHidden: hiddenLegacyUrls.length,
      blogTotalRows: blogCsv.rows.length,
      productsAllowedCount: allowedProductIds.length,
      productsHiddenCount: hiddenProductIds.length,
      problematicRows: problematicRows.length,
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
    problematicRows: problematicRows.slice(0, 200),
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