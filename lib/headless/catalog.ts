import "server-only";

import {
  getAllPosts as getFallbackPosts,
  type BlogPost,
} from "@/lib/data/blog";
import {
  getAllProducts as getFallbackProducts,
  getProductById as getFallbackProductById,
  type Product,
} from "@/lib/data/products";
import { LEGACY_CATEGORY_ID_TO_FRONTEND_SLUG } from "@/lib/headless/constants";
import {
  getHeadlessCategoriesMode,
  getHeadlessPostsMode,
  getHeadlessProductsMode,
  isWooConfigured,
  isWordPressConfigured,
} from "@/lib/headless/env";
import type {
  HeadlessBlogPostRecord,
  HeadlessCatalogSnapshot,
  HeadlessMode,
  HeadlessProductRecord,
  ProductCategoryNode,
} from "@/lib/headless/types";
import { getWordPressPosts } from "@/lib/headless/wp";
import {
  getFallbackCatalogSnapshot,
  getVisibilityRowByLegacyId,
} from "@/lib/headless/visibility-catalog";
import { getWooCatalogSnapshot } from "@/lib/headless/woo";

type WooCatalogResult = Awaited<ReturnType<typeof getWooCatalogSnapshot>>;

let wooCatalogPromise: Promise<WooCatalogResult | null> | null = null;
let wpPostsPromise: Promise<HeadlessBlogPostRecord[] | null> | null = null;

function toLegacyProductPath(product: Product, frontendSlug?: string): string {
  const id = String(product.id || "");
  const cleanSlug =
    String(frontendSlug || "").trim()
    || product.slug.replace(new RegExp(`-${id}$`), "")
    || product.slug;

  if (/^\d+$/.test(id)) {
    return `/p${id}-${cleanSlug}.html`;
  }

  return `/p/${product.slug}`;
}

function wrapFallbackProduct(product: Product): HeadlessProductRecord {
  const visibilityRow = getVisibilityRowByLegacyId(String(product.id));
  const frontendSlug =
    visibilityRow?.frontendSlug
    || product.slug.replace(new RegExp(`-${product.id}$`), "")
    || product.slug;

  return {
    ...product,
    source: "fallback",
    frontendSlug,
    frontendPath: toLegacyProductPath(product, frontendSlug),
  };
}

function wrapFallbackPost(post: BlogPost): HeadlessBlogPostRecord {
  return {
    ...post,
    source: "fallback",
  };
}

async function maybeGetWooCatalog(): Promise<WooCatalogResult | null> {
  if (!isWooConfigured()) {
    return null;
  }

  if (!wooCatalogPromise) {
    wooCatalogPromise = getWooCatalogSnapshot().catch(() => null);
  }

  return wooCatalogPromise;
}

async function maybeGetWordPressPosts(): Promise<HeadlessBlogPostRecord[] | null> {
  if (!isWordPressConfigured()) {
    return null;
  }

  if (!wpPostsPromise) {
    wpPostsPromise = getWordPressPosts().catch(() => null);
  }

  return wpPostsPromise;
}

function mergeProducts(
  mode: HeadlessMode,
  fallbackProducts: HeadlessProductRecord[],
  wooProducts: HeadlessProductRecord[] | null,
): HeadlessProductRecord[] {
  if (mode === "fallback" || !wooProducts) {
    return fallbackProducts;
  }

  if (mode === "required") {
    return wooProducts;
  }

  const merged = new Map(fallbackProducts.map((product) => [String(product.id), product]));
  for (const product of wooProducts) {
    merged.set(String(product.id), product);
  }
  return Array.from(merged.values());
}

function mergePosts(
  mode: HeadlessMode,
  fallbackPosts: HeadlessBlogPostRecord[],
  wpPosts: HeadlessBlogPostRecord[] | null,
): HeadlessBlogPostRecord[] {
  if (mode === "fallback" || !wpPosts) {
    return fallbackPosts;
  }

  if (mode === "required") {
    return wpPosts;
  }

  const merged = new Map<string, HeadlessBlogPostRecord>();
  for (const post of fallbackPosts) {
    merged.set(`fallback:${post.slug}`, post);
  }

  for (const post of wpPosts) {
    const bySlug = Array.from(merged.entries()).find(([, current]) => current.slug === post.slug)?.[0];
    if (bySlug) {
      merged.delete(bySlug);
    }
    merged.set(`wp:${post.slug}`, post);
  }

  return Array.from(merged.values()).sort((left, right) => {
    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}

function resolveCategorySnapshot(
  mode: HeadlessMode,
  fallbackSnapshot: HeadlessCatalogSnapshot,
  wooCatalog: WooCatalogResult | null,
): HeadlessCatalogSnapshot {
  if (mode === "fallback" || !wooCatalog) {
    return fallbackSnapshot;
  }

  if (mode === "required") {
    return wooCatalog.categories;
  }

  if (wooCatalog.categories.categories.length > 0) {
    return wooCatalog.categories;
  }

  return fallbackSnapshot;
}

async function getMergedProducts(): Promise<HeadlessProductRecord[]> {
  const fallbackProducts = getFallbackProducts().map(wrapFallbackProduct);
  const wooCatalog = await maybeGetWooCatalog();
  return mergeProducts(getHeadlessProductsMode(), fallbackProducts, wooCatalog?.products || null);
}

async function getMergedPosts(): Promise<HeadlessBlogPostRecord[]> {
  const fallbackPosts = getFallbackPosts().map(wrapFallbackPost);
  const wpPosts = await maybeGetWordPressPosts();
  return mergePosts(getHeadlessPostsMode(), fallbackPosts, wpPosts);
}

async function getResolvedCategorySnapshot(): Promise<HeadlessCatalogSnapshot> {
  const fallbackSnapshot = getFallbackCatalogSnapshot();
  const wooCatalog = await maybeGetWooCatalog();
  return resolveCategorySnapshot(getHeadlessCategoriesMode(), fallbackSnapshot, wooCatalog);
}

function matchesProductSlug(product: HeadlessProductRecord, slug: string): boolean {
  return product.slug === slug || product.frontendSlug === slug;
}

export async function getProductCategories(): Promise<ProductCategoryNode[]> {
  const snapshot = await getResolvedCategorySnapshot();
  return snapshot.categories;
}

export async function getProductCategoryBySlug(
  slug: string,
): Promise<ProductCategoryNode | undefined> {
  const snapshot = await getResolvedCategorySnapshot();
  return snapshot.categoryBySlug.get(String(slug || "").trim().replace(/^\/+|\/+$/g, ""));
}

export async function getProductsByCategory(slug: string): Promise<HeadlessProductRecord[]> {
  const cleanSlug = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) {
    return [];
  }

  const [products, snapshot] = await Promise.all([
    getMergedProducts(),
    getResolvedCategorySnapshot(),
  ]);

  const ids = snapshot.productIdsByCategorySlug.get(cleanSlug);
  if (!ids) {
    return [];
  }

  return products.filter((product) => ids.has(String(product.id)));
}

export async function getProductBySlug(
  slug: string,
): Promise<HeadlessProductRecord | undefined> {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug) {
    return undefined;
  }

  const products = await getMergedProducts();
  return products.find((product) => matchesProductSlug(product, cleanSlug));
}

export async function getProductByLegacyId(
  legacyId: string,
): Promise<HeadlessProductRecord | undefined> {
  const cleanId = String(legacyId || "").trim();
  if (!cleanId) {
    return undefined;
  }

  const products = await getMergedProducts();
  return products.find((product) => String(product.id) === cleanId);
}

export async function getProducts(): Promise<HeadlessProductRecord[]> {
  return getMergedProducts();
}

export async function getProductsByLegacyMenuId(
  legacyMenuId: string,
): Promise<HeadlessProductRecord[]> {
  const wanted = String(legacyMenuId || "").trim();
  if (!wanted) {
    return [];
  }

  const slug = LEGACY_CATEGORY_ID_TO_FRONTEND_SLUG[wanted];
  if (!slug) {
    return [];
  }

  if (slug === "all") {
    return getMergedProducts();
  }

  return getProductsByCategory(slug);
}

export async function getPosts(): Promise<HeadlessBlogPostRecord[]> {
  return getMergedPosts();
}

export async function getPostBySlug(
  slug: string,
): Promise<HeadlessBlogPostRecord | undefined> {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug) {
    return undefined;
  }

  const posts = await getMergedPosts();
  return posts.find((post) => post.slug === cleanSlug);
}

function normalizeIncomingBlogPath(incoming: string): string {
  const clean = String(incoming || "").trim();
  if (!clean) {
    return "";
  }

  const path = clean.startsWith("/blog/") ? clean : `/blog/${clean}`;
  return path.replace(/\/+$/g, "");
}

export async function resolvePostFromIncoming(
  incoming: string,
): Promise<HeadlessBlogPostRecord | undefined> {
  const wanted = normalizeIncomingBlogPath(incoming);
  if (!wanted) {
    return undefined;
  }

  const posts = await getMergedPosts();
  const byLegacyUrl = posts.find((post) => {
    const legacyUrl = String(post.legacyUrl || "").trim().replace(/\/+$/g, "");
    if (!legacyUrl) {
      return false;
    }
    return legacyUrl === wanted || legacyUrl === `${wanted}.html`;
  });

  if (byLegacyUrl) {
    return byLegacyUrl;
  }

  const slug = wanted
    .replace(/^\/blog\//, "")
    .replace(/\.html$/i, "")
    .replace(/^p\d+-/i, "");

  return posts.find((post) => post.slug === slug);
}

export function getFallbackProductForHeadless(legacyId: string): Product | undefined {
  return getFallbackProductById(legacyId);
}
