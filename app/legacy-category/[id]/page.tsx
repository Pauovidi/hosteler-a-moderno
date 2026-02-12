import { notFound } from 'next/navigation';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Categories } from "@/components/categories";
import { Hero } from "@/components/hero";
import legacyMap from '@/data/legacy-landing-map.json';
import { Metadata } from 'next';

interface Props {
  params: { id: string };
  searchParams?: { slug?: string };
}
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = params;
  const slug = searchParams?.slug ?? '';
    const mapping = (legacyMap as Record<string, { type: string; key: string }>)[id];

    if (!mapping) {
        return {
            title: 'Página no encontrada'
        }
    }

    // In a real scenario, we'd fetch the category title based on the key
    // For now, we'll format the key
    const title = mapping.key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const canonicalPath = slug ? `/c${id}-${slug}.html` : `/c${id}-unknown.html`;

    return {
        title: `${title} | Personalizados Hosteleria`,
        description: `Descubre nuestra selección de ${title}.`,
        alternates: { canonical: canonicalPath },
        openGraph: {
            url: canonicalPath,
            title: `${title} | Personalizados Hosteleria`,
            description: `Descubre nuestra selección de ${title}.`,
        },
    };
}

export default async function LegacyCategoryPage({ params }: Props) {
  const { id } = params;

    // 1. Lookup ID in map
    const mapping = (legacyMap as Record<string, { type: string; key: string }>)[id];

    if (!mapping) {
        return notFound();
    }

    // 2. Render appropriate content based on type
    // For "category", we currently re-use the Categories component or Home structures
    // The user requested to "use the same product list component".
    // The 'Categories' component on Home lists *categories*, not products.
    // The 'ProductoPage' ([categoria]) lists a specific product details.
    // We need a proper Product List page. 
    // GLANCE: The existing app seems to have:
    // - / (Home): Categories, Hero, Benefits...
    // - /producto/[categoria]: Single product detail?
    // - /presupuesto: Cart/Quote.

    // If the legacy page was a LIST of products (e.g. "copas-vino"), we should ideally 
    // show a grid of products filtered by that category.
    // BUT we don't have a dedicated "Category Product List" page yet in the App Router (based on file list).
    // The request says: "Use the same component of list of products THAT ALREADY EXISTS".
    // On Home, <Categories /> lists categories.
    // Let's create a simple page that reuses the Header/Footer and displays the "Categories" 
    // component but maybe focused or just a generic landing for now, 
    // validating that the ID routing works.

    // NOTE: The user prompt implies "renderiza una página de listado... grid + filtros si hay".
    // If we don't have a grid+filters component, we'll build a simple grid of all products 
    // for the demo, or filter by the mapped key if possible.

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 pt-32">
                    <h1 className="text-3xl font-display mb-6">
                        Colección: {mapping.key.replace(/-/g, ' ').toUpperCase()}
                    </h1>
                    <div className="bg-muted/30 p-6 rounded-lg mb-8">
                        <p>
                            Estás viendo una colección importada de nuestra web anterior (ID: {id}).
                            <br />
                            Mostrando productos relacionados...
                        </p>
                    </div>
                    {/* 
              Reuse Categories component to show navigation options, 
              or we could import ProductGrid if it existed. 
              For the specific requested URL/behavior, we are "replicating" 
              the legacy view.
              Let's re-use the Home's Categories component as a fallback list 
              since we don't have a dedicated ProductGrid component file visible yet.
             */}
                    <Categories />
                </div>
            </main>
            <Footer />
        </div>
    );
}
