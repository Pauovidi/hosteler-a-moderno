// lib/seo.ts
import type { Metadata } from "next";
import type { Product } from "./data/products";

const SITE = {
  // Dominio canónico (web antigua) para preservar SEO
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
  const p: any = product as any;

  const meta = (p.metaDescription as string | undefined) || "";
  const shortText = (p.shortDescription as string | undefined) || "";
  const shortHtml = (p.shortDescriptionHtml as string | undefined) || "";

  return meta || shortText || (shortHtml ? stripHtml(shortHtml) : "") || "";
}

function getOgImages(product: Product) {
  // FIX: nunca devolvemos url undefined
  const p: any = product as any;
  const img = p.image as string | undefined;
  if (!img) return undefined;

  return [
    {
      url: img,
      alt: (p.title as string | undefined) ?? SITE.name,
    },
  ];
}

/**
 * Metadata para producto.
 * - canonicalAbs: URL absoluta o path (ej: "/p10446447-mi-producto.html") que quieres como canonical.
 */
export function productMetadata(product: Product, canonicalAbs?: string): Metadata {
  const p: any = product as any;

  const title: string = (p.metaTitle as string | undefined) || (p.title as string | undefined) || SITE.name;
  const description: string = getBestDescription(product);

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
 * Metadata para categoría/landing legacy.
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
 * Metadata base del sitio (usado por app/layout.tsx).
 * Importante: exportamos buildBaseMetadata porque el layout lo está pidiendo.
 */
export function baseMetadata(): Metadata {
  const title = SITE.name;
  const description = `${SITE.name} — Catálogo y productos personalizados para hostelería.`;

  return {
    metadataBase: new URL(SITE.origin),
    title: {
      default: title,
      template: `%s | ${SITE.name}`,
    },
    description,
    openGraph: {
      type: "website",
      url: SITE.origin,
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

// Backwards-compatible exports (para no romper imports existentes)
export const buildBaseMetadata = baseMetadata;

export const getProductSeo = productMetadata;
export const getProductMetadata = productMetadata;
export const buildProductMetadata = productMetadata;

export const buildCategoryMetadata = categoryMetadata;
export const buildCategorySeo = categoryMetadata;
