import { notFound } from "next/navigation";

import { getProductById } from "@/lib/data/products";
import { buildBaseMetadata, buildProductMetadata } from "@/lib/seo";

// Reuse the existing product UI
import ProductClient from "@/app/producto_[categoria]_product-client";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ slug?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps) {
  const base = buildBaseMetadata();
  const { id } = await params;
  if (!id) return base;

  const product = getProductById(id);
  if (!product) return base;

  const sp = (await searchParams) ?? {};
  const legacySlug =
    sp?.slug && sp.slug.trim()
      ? sp.slug.trim()
      : product.slug.replace(new RegExp(`-${id}$`), "");

  const canonicalPath = `/p${id}-${legacySlug}.html`;
  const productMeta = buildProductMetadata(product);

  return {
    ...base,
    ...productMeta,
    alternates: {
      ...(productMeta.alternates || {}),
      canonical: canonicalPath,
    },
    openGraph: {
      ...(productMeta.openGraph || {}),
      url: canonicalPath,
    },
  };
}

export default async function LegacyProductPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const product = getProductById(id);
  if (!product) notFound();

  // El ProductClient de este repo requiere "categoria" (string) pero aquí no existe como tal.
  // Le pasamos el slug para que no casque y para mantener coherencia.
  return (
    <ProductClient product={product} categoria={product.slug} />
  );
}
