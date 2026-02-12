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
  shortDescription?: string; // compat/SEO (texto corto)
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
}

// SIMULATED DATABASE
// In the future, this could be: import products form '@/data/products.json';
// SIMULATED DATABASE
// Importing generated data from CSV migration (real import)
import generatedProducts from './products.json';

// Cast and Map
const productsArray = (generatedProducts as unknown as Product[]).map(p => ({
  ...p,
  // Compat map
  title: p.name,
  image: (p.imagesSource && p.imagesSource.length > 0) ? p.imagesSource[0] : "/placeholder.svg",
  features: p.features || [],
  brands: p.brand ? [p.brand] : (p.brands || []),
  longDescription: p.descriptionHtml || "",
  shortDescription: p.shortDescriptionHtml || ""
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

/**
 * Find product by numeric legacy ID (string in the JSON).
 * Used by legacy SEO routes: /p<ID>-<slug>.html
 */
export function getProductById(id: string): Product | undefined {
  // productsArray is the canonical list loaded from products.json
  return productsArray.find((p) => p.id === id);
}

/**
 * Slugify compatible with the legacy URL scheme.
 * We keep it simple and deterministic.
 */
export function toLegacySlug(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
