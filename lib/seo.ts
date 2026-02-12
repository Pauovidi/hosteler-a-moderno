// lib/seo.ts
import type { Metadata } from "next";
import type { Product } from "./data/products";

const SITE = {
  // Dominio CANÓNICO (web antigua) para preservar SEO
  origin: "https://www.personalizadoshosteleria.com",
  name: "Personalizados Hosteleria",
};

function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return SITE.origin;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE.origin}${path}`;
}

function stripHtml(html: string) {
  return (html || "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBestDescription(product: Product) {
  // prioridad: metaDescription > shortDescription (texto) > shortDescriptionHtml (limpiado) > vacío
  const meta = (product as any).metaDescription as string | undefined;
  const shortText = (product as any).shortDescription as string | undefined;
  const shortHtml = (product as any).shortDescriptionHtml as string | undefined;

  return (
    meta ||
    shortText ||
    (shortHtml ? stripHtml(shortHtml) : "") ||
    ""
  );
}

function getOgImages(product: Product) {
  // FIX DEL ERROR: NO devolvemos url undefined
  const img = (product as any).image as string | undefined;
  if (!img) return undefined;

  return [
    {
      url: img,
      alt: (product as any).title ?? SITE.name,
    },
  ];
}

/**
 * SEO para producto (Metadata Next.js).
 * - canonicalAbs: URL absoluta que quieres como canonical (p.e. legacy /p<ID>-slug.html)
 */
export function productMetadata(product: Product, canonicalAbs?: string): Metadata {
  const title = (product as any).metaTitle || (product as any).title || SITE.name;
  const description = getBestDescription(product);
  const canonical = canonicalAbs ? absoluteUrl(canonicalAbs) : SITE.origin;

  const ogImages = getOgImages(product);

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    type: "website",
    url: canonical,
    title,
    description,
    ...(ogImages ? { images: ogImages } : {}),
  };

  const twitter: NonNullable<Metadata["twitter"]> = {
    card: ogImages ? "summary_large_image" : "summary",
    title,
    description,
    ...(ogImages ? { images: [ogImages[0]!.url] } : {}),
  };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph,
    twitter,
  };
}

/**
 * SEO para categoría/landing legacy.
 */
export function categoryMetadata(opts: {
  title: string;
  description?: string;
  canonicalAbs: string;
}): Metadata {
  const canonical = absoluteUrl(opts.canonicalAbs);
  const title = opts.title || SITE.name;
  const description = opts.description || "";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Aliases por compatibilidad (por si ya estabas importando otro nombre).
 */
export const getProductSeo = productMetadata;
export const getProductMetadata = productMetadata;
export const buildProductMetadata = productMetadata;
export const buildCategoryMetadata = categoryMetadata;
