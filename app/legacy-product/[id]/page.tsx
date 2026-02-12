import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import ProductClient from '@/app/producto/[categoria]/product-client';
import { getProductById, toLegacySlug } from '@/lib/data/products';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slug?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { slug: rawSlug } = await searchParams;

  const product = getProductById(id);
  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const canonicalSlug = slug && slug.length > 0 ? slug : toLegacySlug(product.name || product.title);
  const canonicalPath = `/p${id}-${canonicalSlug}.html`;

  const title = product.metaTitle || product.title;
  const description = product.metaDescription || product.shortDescriptionHtml || '';

  return {
    title: `${title} | Personalizados Hosteleria`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | Personalizados Hosteleria`,
      description,
      url: canonicalPath,
      images: product.image ? [{ url: product.image, alt: title }] : undefined,
    },
  };
}

export default async function LegacyProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  // avoid unawaited promise warnings
  await searchParams;

  const product = getProductById(id);
  if (!product) return notFound();

  // ProductClient expects `categoria` just as a string; pass slug to keep related-products logic sane.
  return <ProductClient product={product} categoria={product.slug} />;
}
