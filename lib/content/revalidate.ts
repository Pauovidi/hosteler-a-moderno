import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import type { BlogPost } from "@/lib/data/blog";
import type { Product } from "@/lib/data/products";
import { getCanonicalBlogPath } from "@/lib/content/blog-store";
import { getCanonicalProductPath } from "@/lib/content/products-store";
import { HEADLESS_CACHE_TAGS } from "@/lib/headless/constants";

export function revalidateProductPaths(product: Product, previousSlug?: string | null): void {
  revalidateTag(HEADLESS_CACHE_TAGS.products);
  revalidateTag(HEADLESS_CACHE_TAGS.categories);
  revalidatePath("/", "layout");
  revalidatePath("/admin/productos");
  revalidatePath("/sitemap.xml");
  revalidatePath("/p/[slug]", "page");
  revalidatePath(getCanonicalProductPath(product));

  if (previousSlug && previousSlug !== product.slug) {
    revalidatePath(`/p/${previousSlug}`);
  }
}

export function revalidateBlogPaths(post: BlogPost, previousSlug?: string | null): void {
  revalidateTag(HEADLESS_CACHE_TAGS.posts);
  revalidatePath("/", "layout");
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath(getCanonicalBlogPath(post));

  if (previousSlug && previousSlug !== post.slug) {
    revalidatePath(`/blog/${previousSlug}`);
  }
}
