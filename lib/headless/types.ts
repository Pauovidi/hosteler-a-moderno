import type { BlogPost } from "@/lib/data/blog";
import type { Product } from "@/lib/data/products";

export type HeadlessMode = "fallback" | "prefer-woo" | "required";

export type HeadlessSource = "fallback" | "woo" | "wp";

export type ProductCategoryNode = {
  slug: string;
  name: string;
  path: string;
  source: HeadlessSource;
  parentSlug: string | null;
  legacyMenuId?: string | null;
  children: ProductCategoryNode[];
  productIds: string[];
};

export type HeadlessProductRecord = Product & {
  source: HeadlessSource;
  frontendSlug: string;
  frontendPath: string;
  wooProductId?: string;
};

export type HeadlessBlogPostRecord = BlogPost & {
  source: HeadlessSource;
};

export type HeadlessCatalogSnapshot = {
  categories: ProductCategoryNode[];
  categoryBySlug: Map<string, ProductCategoryNode>;
  productIdsByCategorySlug: Map<string, Set<string>>;
};
