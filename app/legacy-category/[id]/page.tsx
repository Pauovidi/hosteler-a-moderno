import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllProducts, type Product } from "@/lib/data/products";
import { buildBaseMetadata } from "@/lib/seo";
import { filterProductsForLegacyMenu, legacyMenuMap } from "@/data/legacy-menu-map";

type PageProps = {
  params: { id: string };
  searchParams?: { slug?: string };
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

export async function generateMetadata({ params, searchParams }: PageProps) {
  const base = buildBaseMetadata();
  const id = params?.id;
  if (!id) return base;

  const slug = searchParams?.slug || "";
  const canonicalPath = `/c${id}-${slug}.html`;

  const ruleTitle = legacyMenuMap[id]?.title;
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

  const categoryProducts = filterProductsForLegacyMenu(allProducts, id);
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
          <div className="max-w-2xl mx-auto text-center border border-gray-200 rounded-xl p-8 bg-white">
            <h2 className="text-2xl font-semibold mb-3">No se encontraron productos</h2>
            <p className="text-gray-600 mb-6">Prueba con el catálogo completo o solicita ayuda para encontrar el producto ideal.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/c415714-productos-personalizados.html"
                className="inline-flex items-center justify-center rounded-md bg-black text-white px-5 py-3 font-medium hover:opacity-90"
              >
                Ver todo
              </Link>
              <Link
                href="/presupuesto"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50"
              >
                Pedir presupuesto
              </Link>
            </div>
          </div>
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
                      {stripHtml(product.shortDescription || product.shortDescriptionHtml || "") ||
                        "Producto personalizado para hostelería."}
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
