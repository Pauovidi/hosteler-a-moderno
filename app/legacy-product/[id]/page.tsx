import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data/products";
import ProductClient from "@/components/product/product-client";
import { getAllProducts } from "@/lib/data/products";

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ slug?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { id } = await params;
    const { slug } = await searchParams;
    const product = getProductById(id);

    if (!product) {
        return {
            title: "Producto no encontrado",
        };
    }

    // Canonical Strategy A: Exact Legacy URL
    // If slug is missing from query param (shouldn't happen with rewrite), derive it
    const legacySlug = slug || product.slug.replace(new RegExp(`-${product.id}$`), '');

    // Construct the exact legacy URL including the .html suffix
    // Note: Vercel canonical domain should be configured in metadataBase in layout
    const legacyUrl = `/p${id}-${legacySlug}.html`;

    return {
        title: product.title,
        description: product.metaDescription || product.shortDescriptionHtml?.replace(/<[^>]*>/g, '').substring(0, 160),
        alternates: {
            canonical: legacyUrl,
        },
    };
}

export async function generateStaticParams() {
    // Generate params for all known products to support SSG
    const products = getAllProducts();
    // Filter out products without IDs (compatibility safety)
    return products.filter(p => p.id).map((product) => ({
        id: product.id,
    }));
}

export default async function LegacyProductPage({ params, searchParams }: Props) {
    const { id } = await params;
    const { slug } = await searchParams;

    const product = getProductById(id);

    if (!product) {
        return notFound();
    }

    // Reuse the exact same client component as the new product pages
    // We pass the new slug (category/slug) just for internal linking logic
    // but the page itself is the legacy one
    return <ProductClient product={product} categoria={product.slug} />;
}
