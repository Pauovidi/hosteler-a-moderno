import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getAllProducts, Product } from '@/lib/data/products';
import ProductClient from '../../producto/[categoria]/product-client';

function toLegacySlug(p: Product) {
  const id = String(p.id || '');
  const slug = String(p.slug || '');
  const suffix = `-${id}`;
  return slug.endsWith(suffix) ? slug.slice(0, -suffix.length) : slug;
}

export async function generateMetadata(
  { params, searchParams }: { params: { id: string }; searchParams?: { slug?: string | string[] } }
): Promise<Metadata> {
  const id = params.id;
  const product = getAllProducts().find((p) => String(p.id) === String(id));

  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const rawSlug = (searchParams as any)?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const legacySlug = slug || toLegacySlug(product) || 'producto';
  const canonicalPath = `/p${id}-${legacySlug}.html`;
  const canonical = `https://www.personalizadoshosteleria.com${canonicalPath}`;

  return {
    title: `${product.metaTitle || product.title} | Personalizados Hosteleria`,
    description: product.metaDescription || product.shortDescription || product.shortDescriptionHtml || '',
    alternates: { canonical },
    openGraph: {
      title: product.metaTitle || product.title,
      description: product.metaDescription || product.shortDescription || product.shortDescriptionHtml || '',
      url: canonical,
      images: product.image ? [{ url: product.image, alt: product.title }] : undefined,
    },
  };
}

export default async function LegacyProductPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const product = getAllProducts().find((p) => String(p.id) === String(id));
  if (!product) return notFound();

  return <ProductClient product={product} categoria={product.slug} />;
}
