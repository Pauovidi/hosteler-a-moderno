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
import visibilityProducts from './visibility-products.json';


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
const productsArray = (generatedProducts as unknown as Product[]).map((p) => {
  // --- IMAGE FALLBACK ---
  // Use imagesSource if available; otherwise fall back to images[] from JSON
  const fallbackImages = ((p as any).images as string[] | undefined) ?? [];

  const rawImages = (
    Array.isArray(p.imagesSource) && p.imagesSource.length > 0 ? p.imagesSource : fallbackImages
  ).filter((src) => typeof src === "string");

  // Source of truth: .thumb files → use their pre-generated .webp equivalent in public/media
  const normalizedImages = rawImages
    .map((src) => src.replace(/\.thumb$/i, ".webp"))
    .filter((src) => /\.(webp|png|jpe?g|avif|gif)$/i.test(src));

  // Exclude brand/social/generic assets — extended list including common contaminating filenames
  const isBadAsset = (src: string) => {
    const s = src.toLowerCase();
    return (
      s.includes("logo") ||
      s.includes("facebook") ||
      s.includes("instagram") ||
      s.includes("twitter") ||
      s.includes("linkedin") ||
      s.includes("pinterest") ||
      s.includes("youtube") ||
      s.includes("tiktok") ||
      s.includes("whatsapp") ||
      s.includes("transparent") ||
      s.includes("blank") ||
      s.includes("placeholder") ||
      s.includes("icon") ||
      s.includes("sprite") ||
      s.includes("camion") ||
      s.includes("truck") ||
      s.includes("presupuesto") ||
      s.includes("presupuestos") ||
      s.includes("carrito") ||
      s.includes("compra") ||
      s.includes("default") ||
      s.includes("generico") ||
      s.includes("servilleta") ||
      s.includes("canguro") ||
      s.includes("airlaid") ||
      s.includes("miniservice") ||
      s.includes("-qr") ||
      s.includes(" qr")
    );
  };

  const getPrefixNum = (src: string) => {
    const m = src.match(/\/(\d{2})_/);
    return m ? Number(m[1]) : 99;
  };

  // Remove global brand/noise assets
  const clean = normalizedImages.filter((src) => !isBadAsset(src));

  // Source of truth: prefer THUMB-derived .webp images (01_, 02_, 03_…) over raw jpg/png
  const webps = clean.filter((src) => src.toLowerCase().endsWith(".webp"));

  const chosenImages = (webps.length > 0 ? webps : clean)
    .slice()
    .sort((a, b) => getPrefixNum(a) - getPrefixNum(b));

  const mainImage = chosenImages[0] ?? "/placeholder.svg";

  return {
    ...p,
    // Clean CP850 artifacts early so UI/SEO doesn't show broken accents
    name: fixCp850Controls(p.name),
    slug: p.slug,
    descriptionHtml: p.descriptionHtml ? fixCp850Controls(p.descriptionHtml) : "",
    shortDescriptionHtml: p.shortDescriptionHtml ? fixCp850Controls(p.shortDescriptionHtml) : "",

    // Compat map
    title: fixCp850Controls(p.name),
    // Sorted THUMB-derived webp images (best source), or clean fallback
    imagesSource: chosenImages,
    image: mainImage,
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
  };
});

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

function buildVisibleProductIdSet(): Set<string> {
  const allowedProductIds = Array.isArray((visibilityProducts as any).allowedProductIds)
    ? (visibilityProducts as any).allowedProductIds
    : [];
  const hiddenProductIds = Array.isArray((visibilityProducts as any).hiddenProductIds)
    ? (visibilityProducts as any).hiddenProductIds
    : [];

  const allowedSet = new Set(allowedProductIds.map((id: string) => String(id)));
  const hiddenSet = new Set(hiddenProductIds.map((id: string) => String(id)));

  const visibleSet = new Set<string>();
  for (const id of allowedSet) {
    if (!hiddenSet.has(id)) {
      visibleSet.add(id);
    }
  }

  return visibleSet;
}

const visibleProductIds = buildVisibleProductIdSet();

export function isProductVisibleInListings(productId: string): boolean {
  const id = String(productId || "");
  return visibleProductIds.has(id);
}

export function getVisibleProducts(): Product[] {
  return getAllProducts().filter((product) => isProductVisibleInListings(product.id));
}

export function getProductById(id: string): Product | undefined {
  const wanted = String(id);
  return productsArray.find((p) => p.id === wanted);
}
