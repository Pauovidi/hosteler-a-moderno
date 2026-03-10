#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_CSV_PATH = path.join(ROOT, "data/visibility/blog.csv");
const PRODUCTS_CSV_PATH = path.join(ROOT, "data/visibility/products.csv");
const BLOG_JSON_PATH = path.join(ROOT, "lib/data/visibility-blog.json");
const PRODUCTS_JSON_PATH = path.join(ROOT, "lib/data/visibility-products.json");
const REPORT_PATH = path.join(ROOT, "out/visibility-report.json");

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

async function readCsvFixedDelimiter(filePath, delimiter) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`No se encontro el CSV requerido: ${path.relative(ROOT, filePath)}`);
  }

  const text = stripBom(raw);
  const rows = parseDelimited(text, delimiter).filter((r) => r.some((v) => String(v || "").trim()));
  if (!rows.length) {
    throw new Error(`El CSV esta vacio: ${path.relative(ROOT, filePath)}`);
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const dataRows = rows.slice(1).map((cols, idx) => {
    const record = {};
    headers.forEach((header, cidx) => {
      record[header] = String(cols[cidx] || "").trim();
    });
    return { rowNumber: idx + 2, record };
  });

  return { headers, rows: dataRows, delimiter };
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
  const candidates = [",", ";"];
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!lines.length) return ";";

  const scored = candidates.map((delimiter) => ({
    delimiter,
    score: lines.reduce((acc, line) => acc + countDelimiterOutsideQuotes(line, delimiter), 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].delimiter : ";";
}

async function readCsvAutoDelimiter(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`No se encontro el CSV requerido: ${path.relative(ROOT, filePath)}`);
  }

  const text = stripBom(raw);
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter).filter((r) => r.some((v) => String(v || "").trim()));

  if (!rows.length) {
    throw new Error(`El CSV esta vacio: ${path.relative(ROOT, filePath)}`);
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const dataRows = rows.slice(1).map((cols, idx) => {
    const record = {};
    headers.forEach((header, cidx) => {
      record[header] = String(cols[cidx] || "").trim();
    });
    return { rowNumber: idx + 2, record };
  });

  return { headers, rows: dataRows, delimiter };
}

function normalizeId(value) {
  return String(value || "").trim();
}

function pushRare(list, item) {
  list.push(item);
}

async function main() {
  const blog = await readCsvFixedDelimiter(BLOG_CSV_PATH, ",");
  const products = await readCsvAutoDelimiter(PRODUCTS_CSV_PATH);

  const rareRows = [];
  const notes = [];

  const blogUrlColumn = "Páginas principales";
  const blogActionColumn = "Acción";

  if (!blog.headers.includes(blogUrlColumn)) {
    notes.push(`Falta columna en blog.csv: ${blogUrlColumn}`);
  }
  if (!blog.headers.includes(blogActionColumn)) {
    notes.push(`Falta columna en blog.csv: ${blogActionColumn}`);
  }

  const hiddenLegacyUrlSet = new Set();

  for (const row of blog.rows) {
    const url = String(row.record[blogUrlColumn] || "").trim();
    const action = String(row.record[blogActionColumn] || "").trim();

    if (!url && action) {
      pushRare(rareRows, {
        file: "blog.csv",
        rowNumber: row.rowNumber,
        type: "missing_url",
        value: action,
      });
      continue;
    }

    if (url && /^eliminar/i.test(action)) {
      hiddenLegacyUrlSet.add(url);
    }
  }

  const idColumn = "ID";
  const removeColumn = "QUITAR o eliminar";

  if (!products.headers.includes(idColumn)) {
    notes.push(`Falta columna en products.csv: ${idColumn}`);
  }
  if (!products.headers.includes(removeColumn)) {
    notes.push(`Falta columna en products.csv: ${removeColumn}`);
  }

  const allowedSet = new Set();
  const hiddenSet = new Set();
  const emptyIdRows = [];

  for (const row of products.rows) {
    const id = normalizeId(row.record[idColumn]);
    const removeFlag = String(row.record[removeColumn] || "").trim();

    if (!id) {
      emptyIdRows.push(row.rowNumber);
      pushRare(rareRows, {
        file: "products.csv",
        rowNumber: row.rowNumber,
        type: "empty_id",
      });
      continue;
    }

    allowedSet.add(id);

    if (/^x$/i.test(removeFlag)) {
      hiddenSet.add(id);
    }
  }

  const hiddenLegacyUrls = Array.from(hiddenLegacyUrlSet).sort();
  const allowedProductIds = Array.from(allowedSet).sort();
  const hiddenProductIds = Array.from(hiddenSet).sort();

  await fs.mkdir(path.dirname(BLOG_JSON_PATH), { recursive: true });
  await fs.mkdir(path.dirname(PRODUCTS_JSON_PATH), { recursive: true });
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

  await fs.writeFile(BLOG_JSON_PATH, `${JSON.stringify({ hiddenLegacyUrls }, null, 2)}\n`, "utf8");
  await fs.writeFile(PRODUCTS_JSON_PATH, `${JSON.stringify({ allowedProductIds, hiddenProductIds }, null, 2)}\n`, "utf8");

  const report = {
    counts: {
      blogRows: blog.rows.length,
      blogHidden: hiddenLegacyUrls.length,
      productsRows: products.rows.length,
      allowedProductIds: allowedProductIds.length,
      hiddenProductIds: hiddenProductIds.length,
      emptyProductIds: emptyIdRows.length,
      rareRows: rareRows.length,
    },
    delimiters: {
      blog: blog.delimiter,
      products: products.delimiter,
    },
    columns: {
      blog: {
        url: blogUrlColumn,
        action: blogActionColumn,
      },
      products: {
        id: idColumn,
        remove: removeColumn,
      },
    },
    emptyIdRows,
    rareRows,
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