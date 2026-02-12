import { notFound } from 'next/navigation';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllProducts, Product } from "@/lib/data/products";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import legacyMap from '@/data/legacy-landing-map.json';
import { Metadata } from 'next';

// Correct Type Definition matching legacy-landing-map.json
type LegacyMapItem = {
    title: string;
    mode: "all" | "categoryExact" | "categoryContains";
    value?: string;
};

const LANDING_MAP = legacyMap as unknown as Record<string, LegacyMapItem>;

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ slug?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { id } = await params;
    const { slug } = await searchParams;

    const mapItem = LANDING_MAP[id];

    if (!mapItem) {
        return {
            title: 'Categoría no encontrada'
        }
    }

    // Canonical Strategy A: Exact Legacy URL
    const legacySlug = slug || "productos-personalizados"; // Fallback if missing
    const legacyUrl = `/c${id}-${legacySlug}.html`;

    return {
        title: `${mapItem.title} - Personalizados Hostelería`,
        description: `Catálogo de ${mapItem.title}.`,
        alternates: {
            canonical: legacyUrl,
        },
    };
}

export async function generateStaticParams() {
    return Object.keys(LANDING_MAP).map(id => ({
        id: id
    }));
}

export default async function LegacyCategoryPage({ params }: Props) {
    const { id } = await params;
    const mapItem = LANDING_MAP[id];

    if (!mapItem) {
        return notFound();
    }

    const allProducts = getAllProducts();
    let categoryProducts: Product[] = [];

    // Filter Logic
    if (mapItem.mode === "all") {
        categoryProducts = allProducts;
    } else if (mapItem.mode === "categoryExact" && mapItem.value) {
        categoryProducts = allProducts.filter(p => p.categoriesFlat.includes(mapItem.value as string));
    } else if (mapItem.mode === "categoryContains" && mapItem.value) {
        categoryProducts = allProducts.filter(p =>
            p.categoriesFlat.some(cat => cat.includes(mapItem.value as string))
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                            {mapItem.title}
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Selección de productos clásicos.
                        </p>
                    </div>

                    {categoryProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {categoryProducts.map((product) => {
                                const legacySlug = product.slug.replace(new RegExp(`-${product.id}$`), '');
                                const productUrl = `/p${product.id}-${legacySlug}.html`;

                                return (
                                    <Link key={product.id} href={productUrl} className="group">
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
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/30 rounded-lg">
                            <p className="text-xl text-muted-foreground mb-6">
                                No hemos encontrado productos en esta sección.
                            </p>
                            <Link href="/">
                                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display">
                                    Volver al Inicio
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
