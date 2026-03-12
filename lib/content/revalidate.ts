import "server-only";

import { revalidatePath } from "next/cache";

import type { BlogPost } from "@/lib/data/blog";
import type { Product } from "@/lib/data/products";
import { getCanonicalBlogPath } from "@/lib/content/blog-store";
import { getCanonicalProductPath } from "@/lib/content/products-store";

export function revalidateProductPaths(product: Product, previousSlug?: string | null): void {
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
