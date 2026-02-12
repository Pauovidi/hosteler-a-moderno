import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getAllProducts, Product, toLegacySlug } from '@/lib/data/products';

// Optional map (if you have it). If missing, we fall back to slug-based filtering.
// Keep the import inside try/catch to avoid build errors if the file is not present.
let LANDING_MAP: Record<string, { title?: string; mode?: 'all' | 'categoryExact' | 'categoryContains'; value?: string }> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LANDING_MAP = require('@/data/legacy-landing-map.json');
} catch {
  LANDING_MAP = {};
}

function prettyTitleFromSlug(slug: string) {
  const s = (slug || '').replace(/\.html$/i, '').replace(/-/g, ' ').trim();
  if (!s) return 'Productos';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function slugKeywords(slug: string) {
  const stop = new Set([
    'personalizado','personalizados','personalizada','personalizadas',
    'hosteleria','hostelería','restauracion','restauración','para','de','y','en',
    'alta','calidad','bajo','precio','o','la','el','los','las','del','al','mm','cl','uds','ud'
  ]);
  return (slug || '')
    .toLowerCase()
    .split('-')
    .map((t) => t.trim())
    .filter((t) => t && t.length >= 3 && !stop.has(t));
}

function matchesBySlug(product: Product, legacySlug: string) {
  const keys = slugKeywords(legacySlug);
  if (keys.length === 0) return false;

  const hay = [
    product.title,
    ...(product.categoriesFlat || []),
    ...(product.categoryPaths || []),
  ]
    .join(' ')
    .toLowerCase();

  return keys.some((k) => hay.includes(k));
}

export async function generateMetadata(
  { params, searchParams }: { params: { id: string }; searchParams?: { slug?: string } }
): Promise<Metadata> {
  const id = params.id;
  const legacySlug = searchParams?.slug || 'productos-personalizados';
  const mapItem = LANDING_MAP?.[id];

  const title = mapItem?.title || prettyTitleFromSlug(legacySlug);

  const canonicalPath = `/c${id}-${legacySlug}.html`;
  const canonical = `https://www.personalizadoshosteleria.com${canonicalPath}`;

  return {
    title: `${title} - Personalizados Hostelería`,
    description: `Catálogo de ${title}.`,
    alternates: { canonical },
  };
}

export default async function LegacyCategoryPage(
  { params, searchParams }: { params: { id: string }; searchParams?: { slug?: string } }
) {
  const id = params.id;
  const legacySlug = searchParams?.slug || 'productos-personalizados';

  const allProducts = getAllProducts();
  if (!allProducts.length) {
    // Data not generated or missing
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              {prettyTitleFromSlug(legacySlug)}
            </h1>
            <p className="text-muted-foreground">
              No hay catálogo disponible todavía (falta generar <code>lib/data/products.json</code>).
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const mapItem = LANDING_MAP?.[id];
  let categoryProducts: Product[] = [];

  if (mapItem?.mode === 'all') {
    categoryProducts = allProducts;
  } else if (mapItem?.mode === 'categoryExact' && mapItem.value) {
    categoryProducts = allProducts.filter((p) => p.categoriesFlat.includes(mapItem.value as string));
  } else if (mapItem?.mode === 'categoryContains' && mapItem.value) {
    categoryProducts = allProducts.filter((p) => p.categoriesFlat.some((c) => c.includes(mapItem.value as string)));
  } else {
    // Fallback: infer category by slug keywords (no mapping needed)
    categoryProducts = allProducts.filter((p) => matchesBySlug(p, legacySlug));
  }

  // If still empty, don't 404 — show empty state (SEO-safe)
  const title = mapItem?.title || prettyTitleFromSlug(legacySlug);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Selección de productos.
            </p>
          </div>

          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryProducts.map((product) => {
                const productLegacySlug = toLegacySlug(product) || 'producto';
                const productUrl = `/p${product.id}-${productLegacySlug}.html`;

                const price = typeof product.price === 'number' ? product.price : 0;

                return (
                  <Link key={product.id} href={productUrl} className="group">
                    <div className="border border-border rounded-lg overflow-hidden transition-all hover:shadow-lg hover:border-gold/30">
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        <Image
                          src={product.image || '/placeholder.svg'}
                          alt={product.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-display text-lg text-foreground mb-2 group-hover:text-gold transition-colors">
                          {product.title}
                        </h3>
                        {price > 0 ? (
                          <p className="text-muted-foreground font-medium">
                            Desde {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)}
                          </p>
                        ) : (
                          <p className="text-muted-foreground font-medium">
                            Solicitar presupuesto
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No hay productos en esta categoría (todavía).
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
