import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getVisibleProducts } from "@/lib/content/products-store";
import { buildProductMetadata } from "@/lib/seo";
import ProductClient from "@/components/product/product-client";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        return {
            title: "Producto no encontrado",
        };
    }

    return buildProductMetadata(product);
}

export async function generateStaticParams() {
    const products = await getVisibleProducts();
    return products.map((product) => ({
        slug: product.slug,
    }));
}

export default async function ProductDetailPage({ params }: Props) {
    const { slug } = await params;
    const [product, visibleProducts] = await Promise.all([
      getProduct(slug),
      getVisibleProducts(),
    ]);

    if (!product) {
        return notFound();
    }

    const relatedProducts = visibleProducts.filter((candidate) => candidate.slug !== slug).slice(0, 8);

    return <ProductClient product={product} relatedProducts={relatedProducts} />;
}
