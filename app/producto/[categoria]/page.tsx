import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/data/products";
import { buildProductMetadata } from "@/lib/seo";
import ProductClient from "./product-client";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ categoria: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const product = getProduct(categoria);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return buildProductMetadata(product);
}

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    categoria: product.slug,
  }));
}

export default async function ProductoPage({ params }: Props) {
  const { categoria } = await params;
  const product = getProduct(categoria);

  if (!product) {
    // Keeping the Not Found UI consistent with the original design (wrapped in layout elements)
    // Alternatively, we could use notFound() which triggers the global not-found page, 
    // but the original code had inline error handling. We'll replicate that structure here 
    // but since we want to keep it simple, calling notFound() is usually better for SEO (404 status).
    // However, the prompt asked to "Matches the existing v0 design exactly". 
    // The original design rendered a specific UI. Let's return that UI.
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="font-display text-2xl text-foreground mb-4">Producto no encontrado</h1>
            <Link href="/">
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <ProductClient product={product} categoria={categoria} />;
}

