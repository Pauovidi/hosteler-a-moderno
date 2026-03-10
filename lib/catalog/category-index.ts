import fs from "node:fs";
import path from "node:path";

type CategoryIndex = {
  byCategory: Map<string, Set<string>>;
  bySubCategory: Map<string, Set<string>>;
};

export const CATEGORY_LABELS: Record<string, string> = {
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

let memoizedIndex: CategoryIndex | null = null;

function detectDelimiter(headerLine: string): "," | ";" {
  const commas = (headerLine.match(/,/g) || []).length;
  const semicolons = (headerLine.match(/;/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: "," | ";"): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      fields.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

function slugFromPathname(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.replace(/^\/+|\/+$/g, "");
}

function addToIndex(map: Map<string, Set<string>>, key: string, id: string) {
  if (!key || !id) return;
  const ids = map.get(key) || new Set<string>();
  ids.add(id);
  map.set(key, ids);
}

function readCategoryIndexFromCsv(): CategoryIndex {
  const csvPath = path.join(process.cwd(), "data", "visibility", "products.csv");
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return { byCategory: new Map(), bySubCategory: new Map() };
  }

  const delimiter = detectDelimiter(lines[0]);
  const header = parseCsvLine(lines[0], delimiter);

  const categoryIdx = header.findIndex((h) => h.toLowerCase() === "categoria");
  const subCategoryIdx = header.findIndex((h) => h.toLowerCase() === "sub categories");
  const idIdx = header.findIndex((h) => h.toLowerCase() === "id");

  if (categoryIdx < 0 || subCategoryIdx < 0 || idIdx < 0) {
    return { byCategory: new Map(), bySubCategory: new Map() };
  }

  const byCategory = new Map<string, Set<string>>();
  const bySubCategory = new Map<string, Set<string>>();

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i], delimiter);
    const id = String(row[idIdx] || "").trim();
    const categorySlug = slugFromPathname(row[categoryIdx]);
    const subCategorySlug = slugFromPathname(row[subCategoryIdx]);

    if (!id) continue;

    addToIndex(byCategory, categorySlug, id);
    addToIndex(bySubCategory, subCategorySlug, id);
  }

  return { byCategory, bySubCategory };
}

export function getCategoryIndex(): CategoryIndex {
  if (!memoizedIndex) {
    memoizedIndex = readCategoryIndexFromCsv();
  }
  return memoizedIndex;
}

export function getCategoryProductIds(slug: string): string[] {
  const cleanSlug = slugFromPathname(slug);
  const index = getCategoryIndex();

  const fromSubCategory = index.bySubCategory.get(cleanSlug);
  if (fromSubCategory) {
    return Array.from(fromSubCategory);
  }

  const fromCategory = index.byCategory.get(cleanSlug);
  if (fromCategory) {
    return Array.from(fromCategory);
  }

  return [];
}