import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import LegacyCategoryPage from "@/app/legacy-category/[id]/page";
import LegacyProductPage from "@/app/legacy-product/[id]/page";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { buildBaseMetadata, buildProductMetadata } from "@/lib/seo";
import {
  getCanonicalProductPath,
  getProductById,
  getVisibleProducts,
} from "@/lib/content/products-store";
import {
  getProductCategories,
  getProductCategoryBySlug,
  getProductsByCategory,
} from "@/lib/headless/catalog";

type Props = {
  params: Promise<{ legacy: string[] }>;
};

function parseLegacy(segments: string[]) {
  const raw = (segments?.[0] || "").trim();

  // c412083-servilletas-....html
  const m = raw.match(/^([cp])(\d+)(?:-(.+?))?\.html?$/i);
  if (!m) return null;

  return {
    kind: m[1].toLowerCase() as "c" | "p",
    id: m[2],
    slug: (m[3] || "").replace(/\.html?$/i, ""),
  };
}

function getCategorySlug(segments: string[]): string | null {
  if (!Array.isArray(segments) || segments.length !== 1) {
    return null;
  }

  const raw = String(segments[0] || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!raw || raw.includes(".")) {
    return null;
  }

  return raw;
}

async function getCategoryListingData(slug: string) {
  const category = await getProductCategoryBySlug(slug);
  if (!category) {
    return null;
  }

  const visibleProducts = await getVisibleProducts();
  const categoryProducts = await getProductsByCategory(slug);
  const ids = new Set(categoryProducts.map((product) => String(product.id)));
  const products = visibleProducts.filter((product) => ids.has(String(product.id)));

  return {
    slug,
    title: category.name,
    childCategories: category.children,
    products,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = buildBaseMetadata();
  const { legacy } = await params;
  const parsed = parseLegacy(legacy);

  if (parsed) {
    const { kind, id, slug } = parsed;

    const canonical =
      kind === "c"
        ? `/c${id}-${slug}.html`
        : `/p${id}-${slug}.html`;

    if (kind === "c") {
      const title = slug
        ? slug.split("-").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ")
        : "Catálogo";

      return {
        ...base,
        title: `${title} | Personalizados Hosteleria`,
        description: `Descubre ${title.toLowerCase()} en Personalizados Hosteleria.`,
        alternates: { canonical },
        openGraph: {
          ...(base.openGraph || {}),
          title: `${title} | Personalizados Hosteleria`,
          description: `Descubre ${title.toLowerCase()} en Personalizados Hosteleria.`,
          url: canonical,
        },
      };
    }

    const product = await getProductById(id);
    if (!product) return base;

    const productMeta = buildProductMetadata(product);

    return {
      ...base,
      ...productMeta,
      alternates: {
        ...(productMeta.alternates || {}),
        canonical,
      },
      openGraph: {
        ...(productMeta.openGraph || {}),
        url: canonical,
      },
    };
  }

  const categorySlug = getCategorySlug(legacy);
  if (!categorySlug) return base;

  const listing = await getCategoryListingData(categorySlug);
  if (!listing) return base;

  const canonical = `/${listing.slug}`;

  return {
    ...base,
    title: `${listing.title} | Personalizados Hosteleria`,
    description: `Descubre nuestra selección de ${listing.title.toLowerCase()} para hostelería y restauración.`,
    alternates: {
      ...(base.alternates || {}),
      canonical,
    },
    openGraph: {
      ...(base.openGraph || {}),
      title: `${listing.title} | Personalizados Hosteleria`,
      description: `Descubre nuestra selección de ${listing.title.toLowerCase()} para hostelería y restauración.`,
      url: canonical,
    },
  };
}

function CategoryListingPage({
  title,
  childCategories,
  products,
}: {
  title: string;
  childCategories: Awaited<ReturnType<typeof getProductCategories>>;
  products: Awaited<ReturnType<typeof getVisibleProducts>>;
}) {
  const hasChildCategories = childCategories.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">{title}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explora nuestros productos de {title.toLowerCase()} diseñados para uso profesional.
            </p>
          </div>

          {hasChildCategories ? (
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-gold">Subcategorías</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {childCategories.map((child) => (
                  <Link key={child.slug} href={child.path} className="group">
                    <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-card p-6 transition-all hover:border-gold/40 hover:shadow-lg">
                      <div>
                        <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Catálogo</p>
                        <h2 className="font-display text-xl text-foreground transition-colors group-hover:text-gold">
                          {child.name}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          Accede a la selección específica de {child.name.toLowerCase()} dentro de {title.toLowerCase()}.
                        </p>
                      </div>
                      <span className="mt-6 text-sm font-medium text-gold">Ver subcategoría →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Link key={product.id} href={getCanonicalProductPath(product)} className="group">
                  <div className="border border-border rounded-lg overflow-hidden transition-all hover:shadow-lg hover:border-gold/30">
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h2 className="font-display text-lg text-foreground mb-2 group-hover:text-gold transition-colors">
                        {product.title}
                      </h2>
                      {product.price ? (
                        <p className="text-muted-foreground font-medium">
                          Desde {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(product.price)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-lg">
              <p className="text-xl text-muted-foreground mb-6">
                No hemos encontrado productos en esta categoría por el momento.
              </p>
              <Link href="/">
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display">
                  Volver al Catálogo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default async function LegacyCatchAllPage({ params }: Props) {
  const { legacy } = await params;
  const parsed = parseLegacy(legacy);

  if (parsed) {
    const { kind, id, slug } = parsed;

    if (kind === "c") {
      return <LegacyCategoryPage params={Promise.resolve({ id })} searchParams={Promise.resolve({ slug })} />;
    }

    return <LegacyProductPage params={Promise.resolve({ id })} searchParams={Promise.resolve({ slug })} />;
  }

  const categorySlug = getCategorySlug(legacy);
  if (!categorySlug) {
    notFound();
  }

  const listing = await getCategoryListingData(categorySlug);
  if (!listing) {
    notFound();
  }

  return (
    <CategoryListingPage
      title={listing.title}
      childCategories={listing.childCategories}
      products={listing.products}
    />
  );
}
