import "server-only";

import {
  getAllProducts as getFallbackProducts,
  getProduct as getFallbackProduct,
  getProductById as getFallbackProductById,
  getVisibleProducts as getFallbackVisibleProducts,
  isProductVisibleInListings,
  type OptionTier,
  type Product,
} from "@/lib/data/products";
import { listEditableProducts } from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";

type ProductMergeResult = {
  products: Product[];
  ownedSlugs: Set<string>;
};

function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOption(option: Partial<OptionTier>): OptionTier {
  const price = Number(option.price || 0);
  const effectivePrice =
    Number(option.effectivePrice) > 0 ? Number(option.effectivePrice) : price;

  return {
    label: String(option.label || "Opción"),
    price,
    stock: option.stock === undefined ? undefined : Number(option.stock),
    weight: option.weight === undefined ? undefined : Number(option.weight),
    discountType: option.discountType || undefined,
    discountValue:
      option.discountValue === undefined ? undefined : Number(option.discountValue),
    effectivePrice,
  };
}

function normalizeProductRecordPayload(payload: Record<string, unknown>): Product {
  const raw = payload as Partial<Product> & { images?: string[] };
  const id = String(raw.id || "");
  const slug = String(raw.slug || "");
  const descriptionHtml = String(raw.descriptionHtml || "");
  const shortDescriptionHtml = String(raw.shortDescriptionHtml || "");
  const shortDescription =
    String(raw.shortDescription || "").trim() ||
    stripHtml(shortDescriptionHtml || descriptionHtml);
  const imagesSource = Array.isArray(raw.imagesSource)
    ? raw.imagesSource.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : Array.isArray(raw.images)
      ? raw.images.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

  return {
    id,
    name: String(raw.name || raw.title || ""),
    slug,
    descriptionHtml,
    shortDescriptionHtml,
    shortDescription,
    categoryPaths: Array.isArray(raw.categoryPaths)
      ? raw.categoryPaths.map((path) =>
          Array.isArray(path)
            ? path.map((part) => String(part || "").trim()).filter(Boolean)
            : [],
        ).filter((path) => path.length > 0)
      : [],
    categoriesFlat: Array.isArray(raw.categoriesFlat)
      ? raw.categoriesFlat.map((value) => String(value || "").trim()).filter(Boolean)
      : [],
    imagesSource,
    image: String(raw.image || imagesSource[0] || "/placeholder.svg"),
    price: raw.price === undefined ? undefined : Number(raw.price),
    cost: raw.cost === undefined ? undefined : Number(raw.cost),
    tax: raw.tax === undefined ? undefined : Number(raw.tax),
    sku: raw.sku ? String(raw.sku) : undefined,
    brand: raw.brand ? String(raw.brand) : undefined,
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
      : undefined,
    status: raw.status ? String(raw.status) : undefined,
    featured: Boolean(raw.featured),
    secondHand: Boolean(raw.secondHand),
    marketingLabel: raw.marketingLabel ? String(raw.marketingLabel) : undefined,
    marketingLabelDate: raw.marketingLabelDate ? String(raw.marketingLabelDate) : undefined,
    variantName: raw.variantName ? String(raw.variantName) : undefined,
    options: Array.isArray(raw.options)
      ? raw.options.map((option) => normalizeOption(option as Partial<OptionTier>))
      : [],
    features: Array.isArray(raw.features)
      ? raw.features.map((feature) => String(feature || "").trim()).filter(Boolean)
      : [],
    brands: Array.isArray(raw.brands)
      ? raw.brands.map((brand) => String(brand || "").trim()).filter(Boolean)
      : raw.brand
        ? [String(raw.brand)]
        : [],
    title: String(raw.title || raw.name || ""),
    longDescription: String(raw.longDescription || descriptionHtml || ""),
    metaTitle: raw.metaTitle ? String(raw.metaTitle) : undefined,
    metaDescription: raw.metaDescription ? String(raw.metaDescription) : undefined,
    legacyPath: raw.legacyPath ? String(raw.legacyPath) : undefined,
    personalizationsRaw: raw.personalizationsRaw
      ? String(raw.personalizationsRaw)
      : undefined,
    personalizations: Array.isArray(raw.personalizations)
      ? raw.personalizations.map((field) => ({
          label: String((field as { label?: string }).label || ""),
          help: (field as { help?: string }).help
            ? String((field as { help?: string }).help)
            : undefined,
          required: Boolean((field as { required?: boolean }).required),
          kind:
            (field as { kind?: Product["personalizations"][number]["kind"] }).kind ||
            "textarea",
        }))
      : [],
  };
}

function mergePublicProducts(): Promise<ProductMergeResult> {
  return (async () => {
    const fallbackProducts = getFallbackProducts();

    if (!hasDatabaseUrl()) {
      return {
        products: fallbackProducts,
        ownedSlugs: new Set<string>(),
      };
    }

    const records = await listEditableProducts();
    if (records.length === 0) {
      return {
        products: fallbackProducts,
        ownedSlugs: new Set<string>(),
      };
    }

    const merged = new Map(fallbackProducts.map((product) => [product.slug, product]));
    const fallbackByLegacyId = new Map(
      fallbackProducts.map((product) => [String(product.id), product]),
    );
    const ownedSlugs = new Set<string>();

    for (const record of records) {
      const fallbackProduct = record.legacyId
        ? fallbackByLegacyId.get(String(record.legacyId))
        : undefined;

      if (fallbackProduct) {
        merged.delete(fallbackProduct.slug);
      }

      if (record.status !== "published") {
        continue;
      }

      const product = normalizeProductRecordPayload(record.payload);
      ownedSlugs.add(product.slug);
      merged.set(product.slug, product);
    }

    return {
      products: Array.from(merged.values()),
      ownedSlugs,
    };
  })();
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await mergePublicProducts();
  return result.products;
}

export async function getVisibleProducts(): Promise<Product[]> {
  const result = await mergePublicProducts();
  return result.products.filter((product) => {
    if (result.ownedSlugs.has(product.slug)) {
      return true;
    }
    return isProductVisibleInListings(product.id);
  });
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const result = await mergePublicProducts();
  return result.products.find((product) => product.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const result = await mergePublicProducts();
  return result.products.find((product) => String(product.id) === String(id));
}

export function getCanonicalProductPath(product: Product): string {
  const id = String(product.id || "");
  if (/^\d+$/.test(id)) {
    const legacySlug = product.slug.replace(new RegExp(`-${id}$`), "") || product.slug;
    return `/p${id}-${legacySlug}.html`;
  }

  return `/p/${product.slug}`;
}

export function getRelatedVisibleFallbackProducts(
  currentSlug: string,
  limit = 8,
): Product[] {
  return getFallbackVisibleProducts()
    .filter((product) => product.slug !== currentSlug)
    .slice(0, limit);
}

export function getFallbackEditableProductById(id: string): Product | undefined {
  return getFallbackProductById(id);
}

export function getFallbackEditableProductBySlug(slug: string): Product | undefined {
  return getFallbackProduct(slug);
}

export function getFallbackEditableProducts(): Product[] {
  return getFallbackProducts();
}
