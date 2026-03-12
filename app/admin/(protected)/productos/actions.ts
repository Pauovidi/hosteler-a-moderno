"use server";

import { redirect } from "next/navigation";

import type { Product } from "@/lib/data/products";
import { uploadAdminAsset } from "@/lib/content/assets";
import {
  deleteEditableProductRecord,
  getEditableProductRecordByRecordId,
  upsertEditableProductRecord,
} from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";
import { buildProductPayloadFromForm } from "@/lib/content/product-admin";
import { getFallbackEditableProductById } from "@/lib/content/products-store";
import { revalidateProductPaths } from "@/lib/content/revalidate";

async function uploadProductImageIfNeeded(formData: FormData): Promise<string | null> {
  const image = formData.get("imageFile");
  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  const uploaded = await uploadAdminAsset({
    file: image,
    filename: image.name,
    folder: "products",
  });

  return uploaded.url;
}

export async function saveProductAction(formData: FormData): Promise<void> {
  if (!hasDatabaseUrl()) {
    redirect("/admin/productos?error=db");
  }

  const recordId = String(formData.get("recordId") || "").trim();
  const legacyId = String(formData.get("legacyId") || "").trim() || null;
  const previousSlug = String(formData.get("previousSlug") || "").trim() || null;
  const publishStatus = String(formData.get("publishStatus") || "draft") === "published"
    ? "published"
    : "draft";
  const title = String(formData.get("title") || "").trim();

  if (!recordId || !title) {
    redirect("/admin/productos?error=title");
  }

  const existingRecord = await getEditableProductRecordByRecordId(recordId);
  const baseProduct =
    existingRecord?.payload && Object.keys(existingRecord.payload).length > 0
      ? (existingRecord.payload as Product)
      : legacyId
        ? getFallbackEditableProductById(legacyId)
        : undefined;

  let uploadedImageUrl: string | null = null;
  try {
    uploadedImageUrl = await uploadProductImageIfNeeded(formData);
  } catch {
    const target = existingRecord
      ? `/admin/productos/editar?recordId=${existingRecord.recordId}&error=upload`
      : legacyId
        ? `/admin/productos/editar?legacyId=${legacyId}&error=upload`
        : "/admin/productos/nuevo?error=upload";
    redirect(target);
  }

  const payload = buildProductPayloadFromForm({
    formData,
    recordId,
    legacyId,
    baseProduct,
    uploadedImageUrl,
  });

  await upsertEditableProductRecord({
    recordId,
    legacyId,
    slug: payload.slug,
    title: payload.title,
    status: publishStatus,
    imageUrl: payload.image || null,
    payload,
  });

  revalidateProductPaths(payload, previousSlug);

  redirect(`/admin/productos/editar?recordId=${recordId}&saved=1`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  if (!hasDatabaseUrl()) {
    redirect("/admin/productos");
  }

  const recordId = String(formData.get("recordId") || "").trim();
  if (!recordId) {
    redirect("/admin/productos");
  }

  const record = await getEditableProductRecordByRecordId(recordId);
  if (record) {
    const payload = record.payload as Product;
    const currentProduct = {
      ...payload,
      slug: record.slug || String(payload.slug || ""),
      id: record.legacyId || String(payload.id || record.recordId),
      title: record.title || String(payload.title || payload.name || ""),
      name: String(payload.name || payload.title || record.title || ""),
    } as Product;

    await deleteEditableProductRecord(recordId);
    revalidateProductPaths(currentProduct, record.slug);
  }

  redirect("/admin/productos?deleted=1");
}

export async function toggleProductStatusAction(formData: FormData): Promise<void> {
  if (!hasDatabaseUrl()) {
    redirect("/admin/productos");
  }

  const recordId = String(formData.get("recordId") || "").trim();
  const nextStatus = String(formData.get("nextStatus") || "").trim() === "published"
    ? "published"
    : "draft";

  if (!recordId) {
    redirect("/admin/productos");
  }

  const record = await getEditableProductRecordByRecordId(recordId);
  if (!record) {
    redirect("/admin/productos");
  }

  await upsertEditableProductRecord({
    recordId: record.recordId,
    legacyId: record.legacyId,
    slug: record.slug,
    title: record.title,
    status: nextStatus,
    imageUrl: record.imageUrl,
    payload: record.payload,
  });

  revalidateProductPaths(record.payload as Product, record.slug);
  redirect("/admin/productos");
}
