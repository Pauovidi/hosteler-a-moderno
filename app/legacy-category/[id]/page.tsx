import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllProducts, type Product } from "@/lib/data/products";
import { buildBaseMetadata } from "@/lib/seo";

type PageProps = {
  params: { id: string };
  searchParams?: { slug?: string };
};

type MenuRule = {
  title?: string;
  mode?: "all";
  include?: string[];
  exclude?: string[];
};

// ✅ NO creamos lib/legacy. Mapa inline y listo.
// Ajusta keywords si ves que falta/sobra algo.
const MENU_RULES: Record<string, MenuRule> = {
  // Menú
  "415714": { title: "Productos", mode: "all" },

  "412083": {
    title: "Servilletas",
    include: [
      "servilleta",
      "airlaid",
      "tissue",
      "papel",
      "miniservice",
      "miniservicio",
      "portacubiertos",
      "porta cubiertos",
      "portamenú",
      "porta menú",
      "servilletero",
    ],
    exclude: ["copa", "vaso", "cristal", "vajilla", "plato", "cuberter", "tenedor", "cuchillo", "cuchara", "mantel", "textil"],
  },

  "412080": {
    title: "Cristalería",
    include: [
      "copa",
      "vaso",
      "cristal",
      "vidrio",
      "brandy",
      "cognac",
      "vino",
      "gin",
      "tonic",
      "whisky",
      "cerveza",
      "jarra",
      "cava",
      "champagne",
    ],
    exclude: ["servilleta", "airlaid", "vajilla", "plato", "cuberter", "tenedor", "cuchillo", "cuchara", "mantel", "textil"],
  },

  "412082": {
    title: "Vajilla",
    include: ["vajilla", "plato", "taza", "bol", "bowl", "fuente", "bandeja", "porcelana", "cerámica", "ceramica"],
    exclude: ["copa", "vaso", "cristal", "servilleta", "airlaid", "cuberter", "tenedor", "cuchillo", "cuchara", "mantel", "textil"],
  },

  "453874": {
    title: "Cubertería",
    include: ["cuberter", "cubiertos", "tenedor", "cuchillo", "cuchara", "inox", "acero", "stainless"],
    exclude: ["copa", "vaso", "cristal", "servilleta", "airlaid", "vajilla", "plato", "mantel", "textil"],
  },

  "412081": {
    title: "Textil Hoteles",
    include: ["mantel", "manteler", "textil", "hotel", "camino", "delantal", "toalla", "sábana", "sabana", "fundas", "servilleta tela"],
    exclude: ["copa", "vaso", "cristal", "vajilla", "plato", "cuberter", "tenedor", "cuchillo", "cuchara"],
  },
};

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromSlug(slug?: string): string {
  if (!slug) return "Catálogo";
  const clean = slug
    .replace(/\.html$/i, "")
    .split("-")
    .filter(Boolean)
    .join(" ");
  return clean
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function productLegacySlug(product: Product): string {
  const base = String(product.slug || "")
    .replace(new RegExp(`-${product.id}$`), "")
    .replace(/\/+$/g, "")
    .trim();
  return base || "producto";
}

function productHaystack(p: Product): string {
  return normalize(
    [
      p.title,
      p.name,
      p.slug,
      p.shortDescription,
      p.metaTitle,
      p.metaDescription,
      ...(p.categoriesFlat || []),
      ...(p.categoryPaths || []).flat(),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function matchesAny(haystack: string, keywords: string[]): boolean {
  const h = normalize(haystack);
  return keywords.some((k) => {
    const kk = normalize(k);
    return kk.length >= 3 && h.includes(kk);
  });
}

// Fallback viejo (por slug) pero SOLO si no hay regla por ID o si la regla deja 0 resultados
function filterBySlugFallback(products: Product[], legacySlug?: string): Product[] {
  if (!legacySlug) return products;

  const normalizedSlug = normalize(legacySlug);
  if (normalizedSlug.includes("productos") || normalizedSlug.includes("catalog") || normalizedSlug.includes("catalogo")) {
    return products;
  }

  const tokens = normalizedSlug
    .split(/[-\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);

  if (tokens.length === 0) return products;

  const matches = products.filter((p) => {
    const h = productHaystack(p);
    return tokens.some((t) => h.includes(normalize(t)));
  });

  return matches.length ? matches : products;
}

function filterForMenu(id: string, products: Product[], legacySlug?: string) {
  const rule = MENU_RULES[id];

  // Si no hay regla => fallback por slug (lo que ya tenías)
  if (!rule) {
    const bySlug = filterBySlugFallback(products, legacySlug);
    return {
      title: titleFromSlug(legacySlug),
      products: bySlug,
    };
  }

  const title = rule.title || titleFromSlug(legacySlug);

  if (rule.mode === "all") {
    return { title, products };
  }

  const include = rule.include || [];
  const exclude = rule.exclude || [];

  const filtered = products.filter((p) => {
    const h = productHaystack(p);
    if (exclude.length && matchesAny(h, exclude)) return false;
    if (include.length) return matchesAny(h, include);
    return true;
  });

  // Si la regla deja 0 (por keywords pobres), NO rompas: vuelve al fallback por slug
  if (!filtered.length) {
    return {
      title,
      products: filterBySlugFallback(products, legacySlug),
    };
  }

  return { title, products: filtered };
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const base = buildBaseMetadata();
  const id = params?.id;
  if (!id) return base;

  const slug = searchParams?.slug || "";
  const canonicalPath = `/c${id}-${slug}.html`;

  const ruleTitle = MENU_RULES[id]?.title;
  const title = `${ruleTitle || titleFromSlug(slug)} | Personalizados Hosteleria`;
  const description = `Descubre ${normalize(ruleTitle || titleFromSlug(slug)).toLowerCase()} en Personalizados Hosteleria.`;

  return {
    ...base,
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      ...(base.openGraph || {}),
      title,
      description,
      url: canonicalPath,
    },
  };
}

export default function LegacyCategoryPage({ params, searchParams }: PageProps) {
  const id = params?.id;
  if (!id) notFound();

  const legacySlug = searchParams?.slug || "";
  const allProducts = getAllProducts();

  const { title: pageTitle, products: categoryProducts } = filterForMenu(id, allProducts, legacySlug);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">{pageTitle}</h1>
        <p className="text-center text-gray-600 mb-10">
          Mostrando {categoryProducts.length} producto{categoryProducts.length === 1 ? "" : "s"}
        </p>

        {categoryProducts.length === 0 ? (
          <div className="text-center text-gray-600">No hay productos en esta sección.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoryProducts.map((product) => {
              const pSlug = productLegacySlug(product);
              const href = `/p${product.id}-${pSlug}.html`;
              const img = product.image || "/logo-3.jpg";

              return (
                <Link
                  key={product.id}
                  href={href}
                  className="group block rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-gray-50">
                    <Image
                      src={img}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain p-4"
                    />
                  </div>

                  <div className="p-4">
                    <h2 className="font-semibold text-lg leading-snug group-hover:underline">{product.title}</h2>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {product.shortDescription || "Producto personalizado para hostelería."}
                    </p>

                    <div className="mt-4 font-semibold">
                      {typeof product.price === "number" && product.price > 0 ? `${product.price.toFixed(2)} €` : "Consultar"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
