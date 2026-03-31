import { Metadata } from "next";
import { getCanonicalProductPath, getVisibleProducts } from "@/lib/content/products-store";
import { Product } from "@/lib/data/products";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getProductCategories, getProductCategoryBySlug, getProductsByCategory } from "@/lib/headless/catalog";

interface Props {
  params: Promise<{ categoria: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getProductCategoryBySlug(categoria);
  const readableName = category?.name || categoria.replace(/-/g, " ");

  return {
    title: `Catálogo: ${readableName} - Personalizados Hostelería`,
    description: `Descubre nuestra selección de ${readableName} para hostelería y restauración.`,
  };
}

export async function generateStaticParams() {
  const categories = await getProductCategories();
  const allCategories = categories.flatMap((category) => [category, ...category.children]);
  return allCategories.map((category) => ({ categoria: category.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const [visibleProducts, category, headlessProducts] = await Promise.all([
    getVisibleProducts(),
    getProductCategoryBySlug(categoria),
    getProductsByCategory(categoria),
  ]);
  const ids = new Set(headlessProducts.map((product) => String(product.id)));
  const categoryProducts: Product[] = visibleProducts.filter((product) => ids.has(String(product.id)));
  const displayName = category?.name || categoria.replace(/-/g, " ").toUpperCase();
  const childCategories = category?.children || [];
  const hasChildCategories = childCategories.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              {displayName}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explora nuestros productos de {displayName.toLowerCase()} diseñados para uso profesional.
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
                          Accede a la selección específica de {child.name.toLowerCase()} dentro de {displayName.toLowerCase()}.
                        </p>
                      </div>
                      <span className="mt-6 text-sm font-medium text-gold">Ver subcategoría →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryProducts.map((product) => (
                <Link key={product.slug} href={getCanonicalProductPath(product)} className="group">
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
                          Desde {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.price)}
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
