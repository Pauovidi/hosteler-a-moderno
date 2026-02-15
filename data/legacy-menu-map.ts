import type { Product } from "@/lib/data/products";

export type LegacyMenuRule = {
  title: string;
  /**
   * Palabras/frases que deben aparecer (OR): si alguna coincide, el producto entra.
   * Se evalúa contra: title, slug, categorías, descripciones (texto plano).
   */
  include?: string[];
  /**
   * Palabras/frases que si aparecen excluyen el producto.
   */
  exclude?: string[];
  /**
   * Modo "all": la página lista TODO el catálogo (útil para "Productos").
   */
  mode?: "all";
};

/**
 * Mapeo de IDs legacy (los que vienen en /c<ID>-...html) a reglas internas.
 * Esto permite:
 * - Mantener URLs legacy (SEO)
 * - Tener menú "tipo categoría" SIN que la categoría esté en el slug real
 * - Evitar mezclar productos en el menú
 */
export const legacyMenuMap: Record<number, LegacyMenuRule> = {
  // Productos (landing)
  415714: {
    title: "Productos",
    mode: "all",
  },

  // Menú principal (según URLs que nos pasaste)
  412083: {
    title: "Servilletas",
    include: [
      "servilleta",
      "servilletero",
      "portacubiertos",
      "porta cubiertos",
      "portamenú",
      "porta menú",
      "posavasos",
      "mantel individual",
      "miniservice",
    ],
    exclude: ["copa", "vaso", "cristal", "vajilla", "plato", "cuchara", "tenedor", "cuchillo"],
  },

  412080: {
    title: "Cristalería",
    include: ["copa", "vaso", "cristal", "jarra", "gin", "tonic", "vino", "cava", "cerveza"],
    exclude: ["servilleta", "servilletero", "vajilla", "plato", "cuberter"],
  },

  412082: {
    title: "Vajilla",
    include: ["plato", "vajilla", "bol", "taza", "cuenco", "bandeja"],
    exclude: ["copa", "vaso", "cristal", "servilleta", "cuberter"],
  },

  453874: {
    title: "Cubiertos",
    include: ["cuchillo", "tenedor", "cuchara", "cuberter", "cubierto"],
    exclude: ["copa", "vaso", "cristal", "servilleta", "vajilla", "plato"],
  },

  412081: {
    title: "Textil Hoteles",
    include: ["mantel", "mantelería", "manteleria", "textil", "hotel", "servilleta de tela"],
    exclude: ["copa", "vaso", "cristal", "cuberter", "plato", "vajilla"],
  },
};

export function resolveLegacyMenuRule(id: number): LegacyMenuRule | null {
  return legacyMenuMap[id] ?? null;
}

/**
 * Helper opcional por si prefieres pre-clasificar el catálogo en build time.
 */
export function classifyProductForLegacyMenus(product: Product): number[] {
  const haystack = (
    [
      product.title,
      product.slug,
      product.shortDescription,
      product.longDescription,
      ...(product.categoriesFlat ?? []),
      ...(product.categoryPaths ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();

  const matches: number[] = [];

  for (const [idStr, rule] of Object.entries(legacyMenuMap)) {
    const id = Number(idStr);

    if (rule.mode === "all") {
      matches.push(id);
      continue;
    }

    const includes = (rule.include ?? []).map((s) => s.toLowerCase());
    const excludes = (rule.exclude ?? []).map((s) => s.toLowerCase());

    const includeOk = includes.length === 0 ? true : includes.some((t) => haystack.includes(t));
    const excludeHit = excludes.some((t) => haystack.includes(t));

    if (includeOk && !excludeHit) matches.push(id);
  }

  return matches;
}
