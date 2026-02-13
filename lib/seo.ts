import { Metadata } from "next";
import { Product } from "./data/products";

const DEFAULT_TITLE = "Personalizados Hosteleria | Branding y Soluciones Integrales";
const DEFAULT_DESCRIPTION =
  "Expertos en productos personalizados para hosteleria: cristaleria, vajilla, cuberteria, servilletas y textil. Entrega rapida y calidad premium europea.";
const SITE_URL = "https://v0-personalizados-hosteleria.vercel.app";

function toAbsoluteUrl(input: string): string {
  if (!input) return SITE_URL;
  if (/^https?:\/\//i.test(input)) return input;
  const path = input.startsWith("/") ? input : `/${input}`;
  return `${SITE_URL}${path}`;
}

function stripHtml(html: string): string {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildBaseMetadata(): Metadata {
  return {
    title: {
      default: DEFAULT_TITLE,
      template: `%s | Personalizados Hosteleria`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: ["hosteleria", "personalizados", "cristaleria", "vajilla", "cuberteria", "servilletas", "hoteles", "HORECA"],
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: SITE_URL,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      siteName: "Personalizados Hosteleria",
      images: [
        {
          url: toAbsoluteUrl("/logo-3.jpg"),
          width: 800,
          height: 600,
          alt: "Personalizados Hosteleria Logo",
        },
      ],
    },
    icons: {
      icon: [{ url: "/favicon.jpg", sizes: "any" }],
      apple: "/favicon.jpg",
    },
  };
}

export function buildProductMetadata(product: Product): Metadata {
  const description =
    product.metaDescription ||
    product.shortDescription ||
    stripHtml(product.shortDescriptionHtml || "") ||
    DEFAULT_DESCRIPTION;

  const imageUrl = toAbsoluteUrl(product.image || "/logo-3.jpg");

  return {
    title: product.metaTitle || product.title,
    description,
    openGraph: {
      title: product.metaTitle || product.title,
      description,
      images: [{ url: imageUrl, alt: product.title }],
    },
  };
}
