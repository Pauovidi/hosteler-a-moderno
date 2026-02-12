import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import productsData from "@/lib/data/products.json";

type Product = {
  id: string;
  name: string;
  slug?: string;
  categoriesFlat?: string[];
  price?: number;
  options?: { label?: string; price?: number; effectivePrice?: number }[];
};

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toLegacySlugFromProduct(p: Product): string {
  const raw = String(p.slug || "").trim();
  const suffix = `-${p.id}`;
  return raw && suffix && raw.endsWith(suffix) ? raw.slice(0, -suffix.length) : raw;
}

function bestCategoryFromSlug(products: Product[], legacySlug: string): string | null {
  const tokens = slugify(legacySlug).split("-").filter(Boolean);
  if (tokens.length === 0) return null;

  // Score categories by how many tokens they contain (and prefer longer matches).
  const score: Record<string, number> = {};
  for (const p of products) {
    for (const cat of p.categoriesFlat || []) {
      const s = slugify(cat);
      let hits = 0;
      for (const t of tokens) if (s.includes(t)) hits += 1;
      if (hits > 0) score[cat] = Math.max(score[cat] || 0, hits * 100 + s.length);
    }
  }

  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : null;
}

function getBestPrice(p: Product): number {
  const base = typeof p.price === "number" ? p.price : 0;
  const opt = (p.options || [])
    .map((o) => (typeof o.effectivePrice === "number" ? o.effectivePrice : (typeof o.price === "number" ? o.price : 0)))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];
  return base > 0 ? base : (opt || 0);
}

export async function generateMetadata(
  { params, searchParams }: { params: { id: string }; searchParams?: Record<string, string | string[] | undefined> }
): Promise<Metadata> {
  const id = params.id;
  const legacySlug = typeof searchParams?.slug === "string" ? searchParams.slug : "";
  const canonicalPath = `/c${id}${legacySlug ? `-${legacySlug}` : ""}.html`;

  return {
    alternates: { canonical: canonicalPath },
    openGraph: { url: canonicalPath },
  };
}

export default function LegacyCategoryPage(
  { params, searchParams }: { params: { id: string }; searchParams?: Record<string, string | string[] | undefined> }
) {
  const products = productsData as unknown as Product[];

  const id = params.id;
  const legacySlug = typeof searchParams?.slug === "string" ? searchParams.slug : "";

  // Primary: try to infer a category from the legacy slug (works even if the ID isn't mapped yet).
  const inferredCategory = bestCategoryFromSlug(products, legacySlug);

  const categoryProducts = inferredCategory
    ? products.filter((p) => (p.categoriesFlat || []).includes(inferredCategory))
    : [];

  // If we couldn't infer anything, don't hard-404: show empty state (still returns 200 for legacy URL).
  // But if the ID is invalid (non-numeric), return 404.
  if (!/^\d+$/.test(id)) return notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">
          {inferredCategory ? inferredCategory : "Categoría"}
        </h1>
        <p className="mt-2 text-sm opacity-80">
          URL legacy: <span className="font-mono">/c{id}{legacySlug ? `-${legacySlug}` : ""}.html</span>
        </p>
      </div>

      {categoryProducts.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p className="text-lg font-medium">No hay productos para mostrar.</p>
          <p className="mt-2 text-sm opacity-80">
            (Esto no es un 404: mantenemos la URL legacy viva. Cuando afinemos el mapeo/heurística, aquí aparecerá el listado.)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categoryProducts.map((product) => {
            const productLegacySlug = toLegacySlugFromProduct(product) || "producto";
            const href = `/p${product.id}-${productLegacySlug}.html`;
            const price = getBestPrice(product);

            return (
              <Link
                key={product.id}
                href={href}
                className="rounded-2xl border p-5 transition hover:shadow-sm"
              >
                <div className="text-sm opacity-70">{product.id}</div>
                <div className="mt-2 text-lg font-semibold leading-snug">{product.name}</div>
                <div className="mt-3 text-sm opacity-80">
                  {price > 0 ? `${price.toFixed(2)} €` : "Solicitar presupuesto"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
