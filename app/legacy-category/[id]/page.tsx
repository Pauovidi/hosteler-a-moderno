import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllProducts, type Product } from "@/lib/data/products";
import { buildBaseMetadata } from "@/lib/seo";
import { legacyMenuMap } from "@/data/legacy-menu-map";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ slug?: string }>;
};

function normalize(s: string): string {
  return String(s || "")
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

function stripHtml(html: string): string {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function productLegacySlug(product: Product): string {
  const base = String(product.slug || "")
    .replace(new RegExp(`-${product.id}$`), "")
    .replace(/\/+$/g, "")
    .trim();
  return base || "producto";
}

/**
 * Filtro por ID del menú legacy (NO hay categorías reales en Palbin).
 * Esto evita mezclas: cada ID de /c<ID>-... tiene su propia regla interna.
 */
function filterByMenuId(products: Product[], menuId: string): Product[] {
  const rule = legacyMenuMap[menuId];
  if (!rule) return products;

  // “Productos” = catálogo completo
  if (rule.mode === "all") return products;

  const inc = (rule.include || []).map(normalize);
  const exc = (rule.exclude || []).map(normalize);

  const filtered = products.filter((p) => {
    const haystack = normalize(
      [
        p.title,
        p.name,
        p.shortDescription,
        stripHtml(p.shortDescriptionHtml || ""),
        stripHtml(p.descriptionHtml || ""),
        p.slug,
        ...(p.categoriesFlat || []),
        ...(p.categoryPaths || []).flat(),
      ]
        .filter(Boolean)
        .join(" ")
    );

    const hasInclude = inc.length === 0 ? true : inc.some((k) => haystack.includes(k));
    const hasExclude = exc.length === 0 ? false : exc.some((k) => haystack.includes(k));

    return hasInclude && !hasExclude;
  });

  // Si por reglas se queda demasiado vacío, mejor mostrar algo útil en vez de “0”
  return filtered.length ? filtered : products;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const base = buildBaseMetadata();
  const { id } = await params;
  if (!id) return base;

  const sp = (await searchParams) ?? {};
  const slug = sp.slug || "";

  const canonicalPath = `/c${id}-${slug}.html`;

  // Título: prioridad al mapa interno (menú), fallback al slug
  const titleFromMap = legacyMenuMap[id]?.title;
  const pageTitle = titleFromMap || titleFromSlug(slug);

  const title = `${pageTitle} | Personalizados Hosteleria`;
  const description = `Descubre ${pageTitle.toLowerCase()} en Personalizados Hosteleria.`;

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

export default async function LegacyCategoryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const sp = (await searchParams) ?? {};
  const legacySlug = sp.slug || "";

  const allProducts = getAllProducts();

  // ✅ Filtrado por ID de menú legacy
  const categoryProducts = filterByMenuId(allProducts, id);

  // H1: prioridad al mapa interno (menú), fallback al slug
  const pageTitle = legacyMenuMap[id]?.title || titleFromSlug(legacySlug);

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
                    <h2 className="font-semibold text-lg leading-snug group-hover:underline">
                      {product.title}
                    </h2>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {product.shortDescription || "Producto personalizado para hostelería."}
                    </p>

                    <div className="mt-4 font-semibold">
                      {typeof product.price === "number" && product.price > 0
                        ? `${product.price.toFixed(2)} €`
                        : "Consultar"}
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
