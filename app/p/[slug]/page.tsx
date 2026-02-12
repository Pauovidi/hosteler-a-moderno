import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/data/products";
import { buildProductMetadata } from "@/lib/seo";
import ProductClient from "@/components/product/product-client";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    // Previously we used 'categoria' param which was actually the slug.
    // Now we use 'slug' directly.
    const product = getProduct(slug);

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
        slug: product.slug,
    }));
}

export default async function ProductDetailPage({ params }: Props) {
    const { slug } = await params;
    const product = getProduct(slug);

    if (!product) {
        return notFound();
    }

    // Pass slug as 'categoria' to keep compatibility if client component relies on it,
    // or refactor client component. The client component used 'categoria' to filter
    // allow listing "Other Products". We can just pass the slug.
    return <ProductClient product={product} categoria={slug} />;
}
