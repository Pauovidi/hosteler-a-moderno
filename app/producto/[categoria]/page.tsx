import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, Product } from "@/lib/data/products";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { slugify } from "@/lib/utils";

// Configuration for Category Mapping
// Keys: URL slugs (normalized)
// Values: Possible exact strings in products.json 'categoriesFlat'
const CATEGORY_ALIASES: Record<string, string[]> = {
  "cristaleria": ["Cristalería Personalizada para Hostelería y Restauración"],
  "vajilla": ["Vajilla Personalizada para Hostelería"],
  "servilletas": ["Servilletas Personalizadas Profesionales para Hostelería y Eventos"],
  "cuberteria": ["CUBIERTOS PERSONALIZADOS"],
  "textil-hoteles": ["MANTELERÍA PERSONALIZADA TEXTIL Y NO TEXTIL", "Textil"],
};

interface Props {
  params: Promise<{ categoria: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;

  // Find readable name
  const aliases = CATEGORY_ALIASES[categoria];
  const readableName = aliases ? aliases[0] : categoria.replace(/-/g, ' ');

  return {
    title: `Catálogo: ${readableName} - Personalizados Hostelería`,
    description: `Descubre nuestra selección de ${readableName} para hostelería y restauración.`,
  };
}

export async function generateStaticParams() {
  // Generate params for known categories
  return Object.keys(CATEGORY_ALIASES).map((cat) => ({
    categoria: cat,
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const products = getAllProducts();

  // Logic to filter products
  // 1. Check exact alias match
  const targetLabels = CATEGORY_ALIASES[categoria];

  let categoryProducts: Product[] = [];

  if (targetLabels) {
    categoryProducts = products.filter(p =>
      p.categoriesFlat.some(cat => targetLabels.includes(cat))
    );
  }

  // 2. Fallback: loose match via slugify
  // If no exact alias, or if we want to catch edge cases, checking if any category slugified contains the param
  if (categoryProducts.length === 0) {
    categoryProducts = products.filter(p =>
      p.categoriesFlat.some(cat => slugify(cat).includes(categoria))
    );
  }

  // Display Name
  const displayName = targetLabels ? targetLabels[0] : categoria.replace(/-/g, ' ').toUpperCase();

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
