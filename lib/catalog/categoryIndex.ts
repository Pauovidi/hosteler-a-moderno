import fs from "node:fs/promises";
import path from "node:path";

type IndexMaps = {
  categoryMap: Map<string, string[]>;
  subCategoryMap: Map<string, string[]>;
};

const PRODUCTS_CSV_PATH = path.join(process.cwd(), "data/visibility/products.csv");

let cache: Promise<IndexMaps> | null = null;

function normalizeSlugPath(input: string): string {
  return String(input || "").trim().replace(/^\/+|\/+$/g, "");
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function countDelimiterOutsideQuotes(line: string, delimiter: string): number {
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

    if (!inQuotes && ch === delimiter) count += 1;
  }

  return count;
}

function detectDelimiter(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!lines.length) return ";";

  const commaScore = lines.reduce((acc, line) => acc + countDelimiterOutsideQuotes(line, ","), 0);
  const semicolonScore = lines.reduce((acc, line) => acc + countDelimiterOutsideQuotes(line, ";"), 0);

  return semicolonScore >= commaScore ? ";" : ",";
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  if (!map.has(key)) map.set(key, new Set<string>());
  map.get(key)!.add(value);
}

function toSortedArrayMap(map: Map<string, Set<string>>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [key, values] of map.entries()) {
    out.set(key, Array.from(values).sort());
  }
  return out;
}

async function buildIndex(): Promise<IndexMaps> {
  let raw: string;
  try {
    raw = await fs.readFile(PRODUCTS_CSV_PATH, "utf8");
  } catch {
    throw new Error(`No se encontró CSV de productos en: ${PRODUCTS_CSV_PATH}`);
  }

  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter).filter((r) => r.some((v) => String(v || "").trim()));

  if (!rows.length) {
    return { categoryMap: new Map(), subCategoryMap: new Map() };
  }

  const headers = rows[0].map((h) => String(h || "").trim());
  const categoryCol = headers.indexOf("CATEGORIA");
  const subCategoryCol = headers.indexOf("SUB Categories");
  const idCol = headers.indexOf("ID");

  if (categoryCol === -1 || subCategoryCol === -1 || idCol === -1) {
    throw new Error("El CSV de productos no contiene columnas obligatorias: CATEGORIA, SUB Categories, ID");
  }

  const categorySetMap = new Map<string, Set<string>>();
  const subCategorySetMap = new Map<string, Set<string>>();

  for (const cols of rows.slice(1)) {
    const id = String(cols[idCol] || "").trim();
    if (!id) continue;

    const categorySlug = normalizeSlugPath(String(cols[categoryCol] || ""));
    const subCategorySlug = normalizeSlugPath(String(cols[subCategoryCol] || ""));

    if (categorySlug) addToSetMap(categorySetMap, categorySlug, id);
    if (subCategorySlug) addToSetMap(subCategorySetMap, subCategorySlug, id);
  }

  return {
    categoryMap: toSortedArrayMap(categorySetMap),
    subCategoryMap: toSortedArrayMap(subCategorySetMap),
  };
}

export async function getCategoryIndex(): Promise<IndexMaps> {
  if (!cache) cache = buildIndex();
  return cache;
}