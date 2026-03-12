import type { Product } from "@/lib/data/products";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import {
  deleteProductAction,
  saveProductAction,
} from "@/app/admin/(protected)/productos/actions";
import {
  getEditableProductRecordByLegacyId,
  getEditableProductRecordByRecordId,
} from "@/lib/content/db";
import { getFallbackEditableProductById } from "@/lib/content/products-store";

export default async function AdminProductEditPage({
  searchParams,
}: {
  searchParams?: Promise<{
    recordId?: string;
    legacyId?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const record = params.recordId
    ? await getEditableProductRecordByRecordId(params.recordId)
    : params.legacyId
      ? await getEditableProductRecordByLegacyId(params.legacyId)
      : null;

  const fallbackProduct = params.legacyId
    ? getFallbackEditableProductById(params.legacyId)
    : record?.legacyId
      ? getFallbackEditableProductById(record.legacyId)
      : undefined;

  const baseProduct =
    record?.payload && Object.keys(record.payload).length > 0
      ? (record.payload as Product)
      : fallbackProduct;

  if (!record && !fallbackProduct) {
    notFound();
  }

  if (!baseProduct) {
    notFound();
  }

  return (
    <ProductForm
      record={record}
      baseProduct={baseProduct}
      searchParams={params}
      saveAction={saveProductAction}
      deleteAction={deleteProductAction}
    />
  );
}
