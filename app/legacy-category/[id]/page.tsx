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

function normalize(s: string): string {
  return s
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

function filterByLegacySlug(products: Product[], legacySlug?: string): Product[] {
  if (!legacySlug) return products;

  const normalizedSlug = normalize(legacySlug);

  if (
    normalizedSlug.includes("productos") ||
    normalizedSlug.includes("catalog") ||
    normalizedSlug.includes("catalogo")
  ) {
    return products;
  }

  const tokens = normalizedSlug
    .split(/[-\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);

  if (tokens.length === 0) return products;

  const matches = products.filter((p) => {
    const haystack = normalize(
      [
        p.title,
        p.name,
        ...(p.categoriesFlat || []),
        ...(p.categoryPaths || []).flat(),
      ]
        .filter(Boolean)
        .join(" ")
    );
    return tokens.some((t) => haystack.includes(t));
  });

  return matches.length ? matches : products;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const base = buildBaseMetadata();
  const id = params?.id;
  if (!id) return base;

  const slug = searchParams?.slug || "";
  const canonicalPath = `/c${id}-${slug}.html`;

  const title = `${titleFromSlug(slug)} | Personalizados Hosteleria`;
  const description = `Descubre ${titleFromSlug(slug).toLowerCase()} en Personalizados Hosteleria.`;

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
  const categoryProducts = filterByLegacySlug(allProducts, legacySlug);

  const pageTitle = titleFromSlug(legacySlug);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">{pageTitle}</h1>
        <p className="text-center text-gray-600 mb-10">
          Mostrando {categoryProducts.length} producto{categoryProducts.length === 1 ? "" : "s"}
        </p>

        {categoryProducts.length === 0 ? (
          <div className="text-center text-gray-600">No hay productos en esta categoría.</div>
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
