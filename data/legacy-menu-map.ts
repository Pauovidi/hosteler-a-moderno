import type { Product } from "@/lib/data/products";

export type LegacyMenuEntry = {
  id: string;
  title: string;
  mode?: "all";
  include?: string[];
  exclude?: string[];
  orIncludes?: string[];
};

function normalize(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string): string {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function productHaystack(product: Product): string {
  return normalize(
    [
      product.title,
      product.name,
      product.slug,
      product.shortDescription,
      stripHtml(product.shortDescriptionHtml || ""),
      stripHtml(product.descriptionHtml || ""),
      ...(product.categoriesFlat || []),
      ...(product.categoryPaths || []).flat(),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function hasAnyKeyword(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => {
    const normalized = normalize(keyword);
    return normalized.length >= 3 && haystack.includes(normalized);
  });
}

export const legacyMenuMap: Record<string, LegacyMenuEntry> = {
  "415714": { id: "415714", title: "Productos", mode: "all" },
  "412083": {
    id: "412083",
    title: "Servilletas",
    include: ["servilleta", "servilletas", "airlaid", "tissue", "portacubiertos", "servilletero"],
    exclude: ["copa", "vaso", "cristal", "plato", "cuberter", "mantel", "textil"],
    orIncludes: ["servilleta", "servilletas", "airlaid", "tissue", "canguro", "portacubiertos"],
  },
  "412080": {
    id: "412080",
    title: "Cristalería",
    include: ["copa", "vaso", "cristal", "vidrio", "jarra", "botella", "vino", "cava", "whisky", "cerveza"],
    exclude: ["servilleta", "airlaid", "plato", "cuberter", "mantel", "textil"],
    orIncludes: ["copa", "vaso", "cristal", "jarra", "botella", "whisky", "vino", "cava", "gin", "cerveza"],
  },
  "412082": {
    id: "412082",
    title: "Vajilla",
    include: ["vajilla", "plato", "cuenco", "bowl", "taza", "porcelana", "ceramica", "bandeja", "fuente"],
    exclude: ["copa", "vaso", "cristal", "servilleta", "airlaid", "cuberter", "mantel", "textil"],
    orIncludes: ["plato", "vajilla", "cuenco", "bowl", "taza", "porcelana", "ceramica", "bandeja", "fuente"],
  },
  "453874": {
    id: "453874",
    title: "Cubertería",
    include: ["cuberter", "cubiertos", "tenedor", "cuchillo", "cuchara", "inox", "acero"],
    exclude: ["copa", "vaso", "cristal", "servilleta", "airlaid", "plato", "mantel", "textil"],
    orIncludes: ["cuchara", "tenedor", "cuchillo", "cubierto", "cuberteria", "inox", "acero"],
  },
  "412081": {
    id: "412081",
    title: "Textil Hoteles",
    include: ["mantel", "manteler", "textil", "hotel", "camino", "delantal", "toalla", "sabana"],
    exclude: ["copa", "vaso", "cristal", "vajilla", "plato", "cuberter"],
    orIncludes: ["mantel", "manteleria", "textil", "camino de mesa", "delantal", "toalla", "sabana", "hotel"],
  },
};

export function filterProductsForLegacyMenu(products: Product[], menuId: string): Product[] {
  const entry = legacyMenuMap[menuId];
  if (!entry) {
    return [];
  }

  if (entry.mode === "all") {
    return products;
  }

  const include = entry.include || [];
  const exclude = entry.exclude || [];

  const picked = products.filter((product) => {
    const haystack = productHaystack(product);

    if (exclude.length > 0 && hasAnyKeyword(haystack, exclude)) {
      return false;
    }

    if (include.length > 0) {
      return hasAnyKeyword(haystack, include);
    }

    return true;
  });

  if (picked.length > 0) {
    return picked;
  }

  if (entry.orIncludes && entry.orIncludes.length > 0) {
    const byKeywords = products.filter((product) => hasAnyKeyword(productHaystack(product), entry.orIncludes || []));
    if (byKeywords.length > 0) {
      return byKeywords;
    }
  }

  if (entry.id === "415714") {
    return products;
  }

  return [];
}
