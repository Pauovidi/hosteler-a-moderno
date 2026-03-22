import "server-only";

import fs from "node:fs";
import path from "node:path";

import { getAllProducts as getFallbackProducts } from "@/lib/data/products";
import { FRONTEND_CATEGORY_LABELS, LEGACY_CATEGORY_ID_TO_FRONTEND_SLUG } from "@/lib/headless/constants";
import type { HeadlessCatalogSnapshot, ProductCategoryNode } from "@/lib/headless/types";

type VisibilityRow = {
  categoryPath: string;
  subCategoryPath: string;
  frontendSlug: string;
  legacyId: string;
  title: string;
  legacyUrl: string;
  images: string[];
};

let visibilityRowsCache: VisibilityRow[] | null = null;
let fallbackSnapshotCache: HeadlessCatalogSnapshot | null = null;

function slugFromPathname(raw: string): string {
  return String(raw || "").trim().replace(/^\/+|\/+$/g, "");
}

function pathFromSlug(slug: string): string {
  return slug ? `/${slug}` : "/";
}

function titleFromSlug(slug: string): string {
  if (FRONTEND_CATEGORY_LABELS[slug]) {
    return FRONTEND_CATEGORY_LABELS[slug];
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
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

function readVisibilityRows(): VisibilityRow[] {
  if (visibilityRowsCache) {
    return visibilityRowsCache;
  }

  const csvPath = path.join(process.cwd(), "data", "visibility", "products.csv");
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    visibilityRowsCache = [];
    return visibilityRowsCache;
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const indexes = {
    categoryPath: headers.findIndex((value) => value.toLowerCase() === "categoria"),
    subCategoryPath: headers.findIndex((value) => value.toLowerCase() === "sub categories"),
    frontendSlug: headers.findIndex((value) => value.toLowerCase() === "slug"),
    legacyId: headers.findIndex((value) => value.toLowerCase() === "id"),
    title: headers.findIndex((value) => value.toLowerCase() === "title"),
    legacyUrl: headers.findIndex((value) => value.toLowerCase() === "legacy url"),
    images: headers.findIndex((value) => value.toLowerCase() === "images"),
  };

  visibilityRowsCache = lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const imagesRaw = indexes.images >= 0 ? values[indexes.images] || "" : "";

    return {
      categoryPath: indexes.categoryPath >= 0 ? values[indexes.categoryPath] || "" : "",
      subCategoryPath: indexes.subCategoryPath >= 0 ? values[indexes.subCategoryPath] || "" : "",
      frontendSlug: indexes.frontendSlug >= 0 ? values[indexes.frontendSlug] || "" : "",
      legacyId: indexes.legacyId >= 0 ? values[indexes.legacyId] || "" : "",
      title: indexes.title >= 0 ? values[indexes.title] || "" : "",
      legacyUrl: indexes.legacyUrl >= 0 ? values[indexes.legacyUrl] || "" : "",
      images: imagesRaw
        .split("|")
        .map((image) => image.trim())
        .filter(Boolean),
    };
  }).filter((row) => row.legacyId);

  return visibilityRowsCache;
}

function ensureCategoryNode(
  nodesBySlug: Map<string, ProductCategoryNode>,
  roots: ProductCategoryNode[],
  slug: string,
  parentSlug: string | null,
): ProductCategoryNode {
  const existing = nodesBySlug.get(slug);
  if (existing) {
    return existing;
  }

  const node: ProductCategoryNode = {
    slug,
    name: titleFromSlug(slug),
    path: pathFromSlug(slug),
    source: "fallback",
    parentSlug,
    legacyMenuId: Object.entries(LEGACY_CATEGORY_ID_TO_FRONTEND_SLUG).find(([, value]) => value === slug)?.[0] || null,
    children: [],
    productIds: [],
  };

  nodesBySlug.set(slug, node);

  if (parentSlug) {
    const parent = nodesBySlug.get(parentSlug);
    if (parent && !parent.children.some((child) => child.slug === slug)) {
      parent.children.push(node);
    }
  } else {
    roots.push(node);
  }

  return node;
}

export function getVisibilityRows(): VisibilityRow[] {
  return readVisibilityRows();
}

export function getVisibilityRowByLegacyId(legacyId: string): VisibilityRow | undefined {
  return readVisibilityRows().find((row) => row.legacyId === String(legacyId));
}

export function getFallbackCatalogSnapshot(): HeadlessCatalogSnapshot {
  if (fallbackSnapshotCache) {
    return fallbackSnapshotCache;
  }

  const roots: ProductCategoryNode[] = [];
  const categoryBySlug = new Map<string, ProductCategoryNode>();
  const productIdsByCategorySlug = new Map<string, Set<string>>();

  for (const row of readVisibilityRows()) {
    const categorySlug = slugFromPathname(row.categoryPath);
    const subCategorySlug = slugFromPathname(row.subCategoryPath);

    if (!categorySlug) {
      continue;
    }

    const categoryNode = ensureCategoryNode(categoryBySlug, roots, categorySlug, null);
    categoryNode.productIds.push(row.legacyId);

    if (!productIdsByCategorySlug.has(categorySlug)) {
      productIdsByCategorySlug.set(categorySlug, new Set<string>());
    }
    productIdsByCategorySlug.get(categorySlug)?.add(row.legacyId);

    if (!subCategorySlug) {
      continue;
    }

    const subCategoryNode = ensureCategoryNode(categoryBySlug, roots, subCategorySlug, categorySlug);
    subCategoryNode.productIds.push(row.legacyId);

    if (!productIdsByCategorySlug.has(subCategorySlug)) {
      productIdsByCategorySlug.set(subCategorySlug, new Set<string>());
    }
    productIdsByCategorySlug.get(subCategorySlug)?.add(row.legacyId);
  }

  fallbackSnapshotCache = {
    categories: roots,
    categoryBySlug,
    productIdsByCategorySlug,
  };

  return fallbackSnapshotCache;
}

export function getFallbackProductsByCategorySlug(slug: string) {
  const cleanSlug = slugFromPathname(slug);
  const ids = getFallbackCatalogSnapshot().productIdsByCategorySlug.get(cleanSlug);
  if (!ids) {
    return [];
  }

  return getFallbackProducts().filter((product) => ids.has(String(product.id)));
}
