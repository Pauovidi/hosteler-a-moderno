import "server-only";

import { getProductById as getFallbackProductById } from "@/lib/data/products";
import { HEADLESS_CACHE_TAGS } from "@/lib/headless/constants";
import { getHeadlessRevalidateSeconds, getWooConsumerKey, getWooConsumerSecret, getWordPressBaseUrl } from "@/lib/headless/env";
import type { HeadlessCatalogSnapshot, HeadlessProductRecord, ProductCategoryNode } from "@/lib/headless/types";
import { getFallbackCatalogSnapshot, getVisibilityRowByLegacyId } from "@/lib/headless/visibility-catalog";

type WooMeta = {
  id?: number;
  key?: string;
  value?: unknown;
};

type WooCategory = {
  id: number;
  parent: number;
  name: string;
  slug: string;
  description?: string;
  menu_order?: number;
  meta_data?: WooMeta[];
};

type WooImage = {
  id?: number;
  src?: string;
  alt?: string;
};

type WooProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  regular_price?: string;
  sale_price?: string;
  sku?: string;
  featured?: boolean;
  status?: string;
  tags?: Array<{ id: number; name: string; slug: string }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
  images?: WooImage[];
  meta_data?: WooMeta[];
};

function getWooApiBaseUrl(): string {
  const baseUrl = getWordPressBaseUrl();
  if (!baseUrl) {
    throw new Error("WP_BASE_URL no está configurada.");
  }

  return `${baseUrl}/wp-json/wc/v3`;
}

function buildWooAuthHeader(): string {
  const key = getWooConsumerKey();
  const secret = getWooConsumerSecret();
  if (!key || !secret) {
    throw new Error("Faltan WC_CONSUMER_KEY o WC_CONSUMER_SECRET.");
  }

  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

function getMetaValue(meta: WooMeta[] | undefined, key: string): unknown {
  return meta?.find((entry) => entry.key === key)?.value;
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toNumber(value: string | undefined): number | undefined {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function ensureFrontendProductPath(legacyId: string, frontendSlug: string): string {
  return `/p${legacyId}-${frontendSlug}.html`;
}

async function fetchWooCollection<T>(resource: string): Promise<T[]> {
  const items: T[] = [];
  const authHeader = buildWooAuthHeader();
  const revalidate = getHeadlessRevalidateSeconds();
  let page = 1;

  while (true) {
    const url = new URL(`${getWooApiBaseUrl()}/${resource}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "100");
    url.searchParams.set("context", "edit");

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
      next: {
        revalidate,
        tags: [HEADLESS_CACHE_TAGS.categories, HEADLESS_CACHE_TAGS.products],
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce ${resource} devolvió ${response.status}.`);
    }

    const batch = (await response.json()) as T[];
    items.push(...batch);

    if (batch.length < 100) {
      break;
    }

    page += 1;
  }

  return items;
}

function buildWooCategorySnapshot(
  categories: WooCategory[],
  products: HeadlessProductRecord[],
): HeadlessCatalogSnapshot {
  const fallbackSnapshot = getFallbackCatalogSnapshot();
  const nodeByWooId = new Map<number, ProductCategoryNode>();
  const categoryBySlug = new Map<string, ProductCategoryNode>();
  const roots: ProductCategoryNode[] = [];

  for (const category of categories) {
    const frontendSlug =
      String(getMetaValue(category.meta_data, "ph_frontend_slug") || "").trim()
      || String(category.slug || "").trim();

    if (!frontendSlug) {
      continue;
    }

    const frontendPath =
      String(getMetaValue(category.meta_data, "ph_frontend_path") || "").trim()
      || `/${frontendSlug}`;
    const parentFrontendSlug =
      String(getMetaValue(category.meta_data, "ph_parent_frontend_slug") || "").trim()
      || null;

    const node: ProductCategoryNode = {
      slug: frontendSlug,
      name: category.name || fallbackSnapshot.categoryBySlug.get(frontendSlug)?.name || frontendSlug,
      path: frontendPath,
      source: "woo",
      parentSlug: parentFrontendSlug,
      legacyMenuId: fallbackSnapshot.categoryBySlug.get(frontendSlug)?.legacyMenuId || null,
      children: [],
      productIds: [],
    };

    nodeByWooId.set(category.id, node);
    categoryBySlug.set(frontendSlug, node);
  }

  for (const category of categories) {
    const node = nodeByWooId.get(category.id);
    if (!node) {
      continue;
    }

    const parent = category.parent ? nodeByWooId.get(category.parent) : null;
    if (parent) {
      node.parentSlug = parent.slug;
      if (!parent.children.some((child) => child.slug === node.slug)) {
        parent.children.push(node);
      }
      continue;
    }

    if (!roots.some((root) => root.slug === node.slug)) {
      roots.push(node);
    }
  }

  const productIdsByCategorySlug = new Map<string, Set<string>>();

  for (const product of products) {
    const seen = new Set<string>();
    for (const path of product.categoryPaths || []) {
      for (const segment of path) {
        const slug = String(segment || "").trim();
        if (!slug || seen.has(slug)) {
          continue;
        }
        seen.add(slug);

        if (!productIdsByCategorySlug.has(slug)) {
          productIdsByCategorySlug.set(slug, new Set<string>());
        }
        productIdsByCategorySlug.get(slug)?.add(String(product.id));

        const categoryNode = categoryBySlug.get(slug);
        if (categoryNode && !categoryNode.productIds.includes(String(product.id))) {
          categoryNode.productIds.push(String(product.id));
        }
      }
    }
  }

  return {
    categories: roots,
    categoryBySlug,
    productIdsByCategorySlug,
  };
}

function mapWooProduct(product: WooProduct): HeadlessProductRecord | null {
  const meta = product.meta_data || [];
  const legacyId =
    String(getMetaValue(meta, "ph_legacy_id") || product.sku || "").trim();

  if (!legacyId) {
    return null;
  }

  const fallbackProduct = getFallbackProductById(legacyId);
  const visibilityRow = getVisibilityRowByLegacyId(legacyId);
  const frontendSlug =
    String(getMetaValue(meta, "ph_frontend_slug") || visibilityRow?.frontendSlug || "").trim()
    || product.slug;
  const dataSlug =
    String(getMetaValue(meta, "ph_data_slug") || fallbackProduct?.slug || "").trim()
    || `${frontendSlug}-${legacyId}`;
  const categoryPaths = safeJsonParse<string[][]>(
    getMetaValue(meta, "ph_category_paths"),
    fallbackProduct?.categoryPaths || [],
  ).map((segments) => segments.map((segment) => String(segment || "").trim()).filter(Boolean)).filter((segments) => segments.length > 0);
  const categoriesFlat = Array.from(new Set(categoryPaths.flat()));
  const options = safeJsonParse(
    getMetaValue(meta, "ph_option_tiers"),
    fallbackProduct?.options || [],
  );
  const features = safeJsonParse(
    getMetaValue(meta, "ph_features"),
    fallbackProduct?.features || [],
  );
  const personalizations = safeJsonParse(
    getMetaValue(meta, "ph_personalizations"),
    fallbackProduct?.personalizations || [],
  );
  const imagesSource = (product.images || []).map((image) => String(image.src || "").trim()).filter(Boolean);
  const price = toNumber(product.regular_price) || fallbackProduct?.price;
  const frontendPath =
    String(getMetaValue(meta, "ph_frontend_path") || "").trim()
    || ensureFrontendProductPath(legacyId, frontendSlug);

  return {
    id: legacyId,
    name: product.name,
    slug: dataSlug,
    title: product.name,
    source: "woo",
    frontendSlug,
    frontendPath,
    wooProductId: String(product.id),
    descriptionHtml: String(product.description || fallbackProduct?.descriptionHtml || ""),
    shortDescriptionHtml: String(product.short_description || fallbackProduct?.shortDescriptionHtml || ""),
    shortDescription:
      fallbackProduct?.shortDescription
      || String(product.short_description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    categoryPaths,
    categoriesFlat,
    imagesSource,
    image: imagesSource[0] || fallbackProduct?.image || "/placeholder.svg",
    price,
    cost: fallbackProduct?.cost,
    tax: fallbackProduct?.tax,
    sku: product.sku || fallbackProduct?.sku || legacyId,
    brand: String(getMetaValue(meta, "ph_brand") || fallbackProduct?.brand || "").trim() || fallbackProduct?.brand,
    tags: Array.isArray(product.tags) ? product.tags.map((tag) => tag.name).filter(Boolean) : fallbackProduct?.tags,
    status: product.status || fallbackProduct?.status,
    featured: Boolean(product.featured),
    secondHand: fallbackProduct?.secondHand || false,
    marketingLabel: String(getMetaValue(meta, "ph_marketing_label") || fallbackProduct?.marketingLabel || "").trim() || fallbackProduct?.marketingLabel,
    marketingLabelDate: fallbackProduct?.marketingLabelDate,
    variantName: String(getMetaValue(meta, "ph_variant_name") || fallbackProduct?.variantName || "").trim() || fallbackProduct?.variantName,
    options,
    features,
    brands: fallbackProduct?.brands || (fallbackProduct?.brand ? [fallbackProduct.brand] : []),
    longDescription: String(product.description || fallbackProduct?.longDescription || ""),
    metaTitle: fallbackProduct?.metaTitle,
    metaDescription: fallbackProduct?.metaDescription,
    legacyPath: frontendPath,
    personalizationsRaw: String(getMetaValue(meta, "ph_personalizations_raw") || fallbackProduct?.personalizationsRaw || "").trim() || fallbackProduct?.personalizationsRaw,
    personalizations,
  };
}

export async function getWooCatalogSnapshot(): Promise<{
  products: HeadlessProductRecord[];
  categories: HeadlessCatalogSnapshot;
}> {
  const [wooCategories, wooProducts] = await Promise.all([
    fetchWooCollection<WooCategory>("products/categories"),
    fetchWooCollection<WooProduct>("products"),
  ]);

  const products = wooProducts
    .filter((product) => product.status === "publish")
    .map((product) => mapWooProduct(product))
    .filter((product): product is HeadlessProductRecord => Boolean(product));

  return {
    products,
    categories: buildWooCategorySnapshot(wooCategories, products),
  };
}
