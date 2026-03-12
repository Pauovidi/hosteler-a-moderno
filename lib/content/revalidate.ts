import "server-only";

import { revalidatePath } from "next/cache";

import type { Product } from "@/lib/data/products";
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
