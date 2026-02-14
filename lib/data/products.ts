// MIGRATION NOTE:
// This file serves as the Single Source of Truth for product data.
// A simpler version is currently used.
// To migrate to a CMS (contentful, strapi, etc) or JSON file:
// 1. Replace the `products` constant with a fetch call or import from a JSON file.
// 2. Update `getAllProducts` and `getProduct` to be async if fetching from an API.
// 3. Ensure the `Product` interface matches your CMS schema.

export interface OptionTier {
  label: string;
  price: number;
  stock?: number;
  weight?: number;
  discountType?: string;
  discountValue?: number;
  effectivePrice: number;
}

export interface Product {
  id: string;
  name: string; // "Nombre"
  slug: string;
  descriptionHtml?: string;
  shortDescriptionHtml?: string;
  /** Compat: short plain-text description used by SEO helpers. */
  shortDescription?: string;
  categoryPaths: string[][];
  categoriesFlat: string[];

  // Images
  imagesSource?: string[];
  image?: string; // Main image derived from imagesSource or placeholder (app compatibility)

  // Pricing
  price?: number; // Base/Header price
  cost?: number;
  tax?: number;

  // Metadata
  sku?: string;
  brand?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  secondHand?: boolean;
  marketingLabel?: string;
  marketingLabelDate?: string;

  // Variants
  variantName?: string;
  options: OptionTier[];

  // Legacy / Misc
  features: string[]; // Compat: mapped from features or empty array
  brands?: string[];

  // Compatibility fields (Runtime mapped)
  title: string;
  longDescription: string;

  metaTitle?: string;
  metaDescription?: string;
  legacyPath?: string;

  // Personalization fields from legacy CMS
  personalizationsRaw?: string;
  personalizations?: PersonalizationField[];
}

export interface PersonalizationField {
  label: string;
  help?: string;
  required?: boolean;
  kind: "text" | "textarea" | "file" | "checkbox";
}


// SIMULATED DATABASE
// In the future, this could be: import products form '@/data/products.json';
// SIMULATED DATABASE
// Importing generated data from CSV migration (real import)
import generatedProducts from './products.json';


function fixCp850Controls(input: string): string {
  const s = String(input || "");
  // Map CP850 bytes 0x80-0x9F that become control chars when decoded as latin1
  const map: Record<string, string> = {
    "\x80": "Ç",
    "\x82": "é",
    "\x84": "ä",
    "\x87": "ç",
    "\x90": "É",
    "\x94": "ö",
    "\x99": "Ö",
    "\x9B": "ø",
  };
  return s
    .replace(/[\x80-\x9F]/g, (ch) => map[ch] || ch)
    .replace(/\u00A0/g, " ");
}

function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPlainText(htmlish: string): string {
  return stripHtml(fixCp850Controls(htmlish));
}

function parsePersonalizations(raw: string | undefined): PersonalizationField[] {
  const input = String(raw || "").trim();
  if (!input) return [];

  // Format (legacy): [Label][Help][Price][Required][Type]|[...]
  const chunks = input.split("|").map((c) => c.trim()).filter(Boolean);
  const fields: PersonalizationField[] = [];

  for (const chunk of chunks) {
    const parts = Array.from(chunk.matchAll(/\[(.*?)\]/g)).map((m) => (m[1] ?? "").trim());
    if (!parts.length) continue;

    const label = parts[0] || "Personalización";
    const help = parts[1] || undefined;
    const requiredRaw = (parts[3] || "").toLowerCase();
    const required = requiredRaw === "1" || requiredRaw === "si" || requiredRaw === "sí" || requiredRaw === "true";
    const type = (parts[4] || "").trim();

    let kind: PersonalizationField["kind"] = "textarea";
    // Best-effort mapping
    if (type === "1") kind = "text";
    else if (type === "2") kind = "textarea";
    else if (type === "5") kind = "checkbox";
    else if (type === "6") kind = "file";

    fields.push({ label: fixCp850Controls(label), help: help ? fixCp850Controls(help) : undefined, required, kind });
  }

  return fields;
}

// Cast and Map
const productsArray = (generatedProducts as unknown as Product[]).map((p) => ({
  ...p,
  // Clean CP850 artifacts early so UI/SEO doesn't show broken accents
  name: fixCp850Controls(p.name),
  slug: p.slug,
  descriptionHtml: p.descriptionHtml ? fixCp850Controls(p.descriptionHtml) : "",
  shortDescriptionHtml: p.shortDescriptionHtml ? fixCp850Controls(p.shortDescriptionHtml) : "",

  // Compat map
  title: fixCp850Controls(p.name),
  image: p.imagesSource && p.imagesSource.length > 0 ? p.imagesSource[0] : "/placeholder.svg",
  features: (p as any).features || [],
  brands: p.brand ? [p.brand] : (p.brands || []),

  // Keep HTML for the product page, but provide clean plain text for cards/SEO
  longDescription: p.descriptionHtml ? fixCp850Controls(p.descriptionHtml) : "",
  shortDescription: p.shortDescriptionHtml
    ? toPlainText(p.shortDescriptionHtml)
    : p.descriptionHtml
    ? toPlainText(p.descriptionHtml)
    : "",

  personalizations: parsePersonalizations((p as any).personalizationsRaw),
}));

export const products: Record<string, Product> = productsArray.reduce((acc, product) => {
  acc[product.slug] = product;
  return acc;
}, {} as Record<string, Product>);

export function getProduct(slug: string): Product | undefined {
  return products[slug];
}

export function getAllProducts(): Product[] {
  return Object.values(products);
}

export function getProductById(id: string): Product | undefined {
  const wanted = String(id);
  return productsArray.find((p) => p.id === wanted);
}
