import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import LegacyCatchAllPage, { generateMetadata as generateLegacyMetadata } from "@/app/[...legacy]/page";
import { getVisibleProducts, type Product } from "@/lib/data/products";
import { getCategoryIndex } from "@/lib/catalog/categoryIndex";

const ENABLED_SLUGS = [
  "cristaleria-personalizada",
  "vajilla-personalizada",
  "servilletas-personalizadas",
  "cuberteria-personalizada",
  "copas-de-vino-personalizadas",
  "cristaleria-cerveza-personalizada",
  "vasos-combinados-botellas-cava",
  "tazas-y-platillos-personalizados",
  "platos-personalizados",
  "fuentes-ensaladeras-personalizadas",
  "platos-de-pizza-personalizados",
  "manteles-caminos-personalizados",
  "servilletas-bar-cocktail-personalizadas",
  "servilletas-de-mesa-personalizadas",
] as const;

const ENABLED_SLUG_SET = new Set<string>(ENABLED_SLUGS);

const SLUG_LABELS: Record<string, string> = {
  "cristaleria-personalizada": "Cristalería Personalizada",
  "vajilla-personalizada": "Vajilla Personalizada",
  "servilletas-personalizadas": "Servilletas Personalizadas",
  "cuberteria-personalizada": "Cubertería Personalizada",
  "copas-de-vino-personalizadas": "Copas de Vino Personalizadas",
  "cristaleria-cerveza-personalizada": "Cristalería Cerveza Personalizada",
  "vasos-combinados-botellas-cava": "Vasos Combinados Botellas Cava",
  "tazas-y-platillos-personalizados": "Tazas y Platillos Personalizados",
  "platos-personalizados": "Platos Personalizados",
  "fuentes-ensaladeras-personalizadas": "Fuentes Ensaladeras Personalizadas",
  "platos-de-pizza-personalizados": "Platos de Pizza Personalizados",
  "manteles-caminos-personalizados": "Manteles Caminos Personalizados",
  "servilletas-bar-cocktail-personalizadas": "Servilletas Bar Cocktail Personalizadas",
  "servilletas-de-mesa-personalizadas": "Servilletas de Mesa Personalizadas",
};

function isLegacyHtmlSlug(slug: string): boolean {
  return /^[cp]\d+-.+\.html?$/i.test(String(slug || ""));
}

function displayNameFromSlug(slug: string): string {
  return SLUG_LABELS[slug] || slug.replace(/-/g, " ");
}

async function findProductIdsForSlug(slug: string): Promise<string[] | null> {
  if (!ENABLED_SLUG_SET.has(slug)) return null;

  const { categoryMap, subCategoryMap } = await getCategoryIndex();
  if (subCategoryMap.has(slug)) return subCategoryMap.get(slug)!;
  if (categoryMap.has(slug)) return categoryMap.get(slug)!;
  return null;
}

function productsByIds(ids: string[], products: Product[]): Product[] {
  const byId = new Map(products.map((p) => [String(p.id), p]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean) as Product[];
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return ENABLED_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (isLegacyHtmlSlug(slug)) {
    return generateLegacyMetadata({ params: Promise.resolve({ legacy: [slug] }) });
  }

  const ids = await findProductIdsForSlug(slug);
  if (!ids) {
    return { title: "Página no encontrada" };
  }

  const title = `${displayNameFromSlug(slug)} | Personalizados Hosteleria`;
  return {
    title,
    description: `Listado de productos para ${displayNameFromSlug(slug)}.`,
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;

  if (isLegacyHtmlSlug(slug)) {
    return <LegacyCatchAllPage params={Promise.resolve({ legacy: [slug] })} />;
  }

  const productIds = await findProductIdsForSlug(slug);
  if (!productIds) notFound();

  const visibleProducts = getVisibleProducts();
  const categoryProducts = productsByIds(productIds, visibleProducts);
  const title = displayNameFromSlug(slug);

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

          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryProducts.map((product) => (
                <Link key={product.slug} href={`/p/${product.slug}`} className="group">
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
                      <h3 className="font-display text-lg text-foreground mb-2 group-hover:text-gold transition-colors">
                        {product.title}
                      </h3>
                      {product.price && (
                        <p className="text-muted-foreground font-medium">
                          Desde {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(product.price)}
                        </p>
                      )}
                      <div className="mt-4 flex items-center text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        Ver Producto →
                      </div>
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