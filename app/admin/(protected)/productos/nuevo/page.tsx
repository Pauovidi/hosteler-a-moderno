import type { Product } from "@/lib/data/products";

import { ProductForm } from "@/components/admin/product-form";
import { saveProductAction, deleteProductAction } from "@/app/admin/(protected)/productos/actions";

export default async function AdminProductNewPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const emptyProduct: Product = {
    id: `product-${crypto.randomUUID()}`,
    name: "",
    slug: "",
    descriptionHtml: "",
    shortDescriptionHtml: "",
    shortDescription: "",
    categoryPaths: [],
    categoriesFlat: [],
    imagesSource: [],
    image: "/placeholder.svg",
    options: [],
    features: [],
    brands: [],
    title: "",
    longDescription: "",
  };

  return (
    <ProductForm
      record={null}
      baseProduct={emptyProduct}
      searchParams={params}
      saveAction={saveProductAction}
      deleteAction={deleteProductAction}
    />
  );
}
