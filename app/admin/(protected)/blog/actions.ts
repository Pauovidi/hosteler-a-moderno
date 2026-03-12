"use server";

import { redirect } from "next/navigation";

import type { BlogPost } from "@/lib/data/blog";
import { uploadAdminAsset } from "@/lib/content/assets";
import { buildBlogPayloadFromForm } from "@/lib/content/blog-admin";
import {
  deleteEditableBlogPostRecord,
  getEditableBlogPostRecordByRecordId,
  upsertEditableBlogPostRecord,
} from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";
import { getFallbackEditablePostById } from "@/lib/content/blog-store";
import { revalidateBlogPaths } from "@/lib/content/revalidate";

async function uploadBlogImageIfNeeded(formData: FormData): Promise<string | null> {
  const image = formData.get("imageFile");
  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  const uploaded = await uploadAdminAsset({
    file: image,
    filename: image.name,
    folder: "blog",
  });

  return uploaded.url;
}

export async function saveBlogPostAction(formData: FormData): Promise<void> {
  if (!hasDatabaseUrl()) {
    redirect("/admin/blog?error=db");
  }

  const recordId = String(formData.get("recordId") || "").trim();
  const legacyId = String(formData.get("legacyId") || "").trim() || null;
  const previousSlug = String(formData.get("previousSlug") || "").trim() || null;
  const publishStatus = String(formData.get("publishStatus") || "draft") === "published"
    ? "published"
    : "draft";
  const title = String(formData.get("title") || "").trim();

  if (!recordId || !title) {
    redirect("/admin/blog?error=title");
  }

  const existingRecord = await getEditableBlogPostRecordByRecordId(recordId);
  const basePost =
    existingRecord?.payload && Object.keys(existingRecord.payload).length > 0
      ? (existingRecord.payload as BlogPost & { contentMarkdown?: string })
      : legacyId
        ? getFallbackEditablePostById(legacyId)
        : undefined;

  let uploadedImageUrl: string | null = null;
  try {
    uploadedImageUrl = await uploadBlogImageIfNeeded(formData);
  } catch {
    const target = existingRecord
      ? `/admin/blog/editar?recordId=${existingRecord.recordId}&error=upload`
      : legacyId
        ? `/admin/blog/editar?legacyId=${legacyId}&error=upload`
        : "/admin/blog/nuevo?error=upload";
    redirect(target);
  }

  const payload = buildBlogPayloadFromForm({
    formData,
    recordId,
    legacyId,
    basePost,
    uploadedImageUrl,
  });

  await upsertEditableBlogPostRecord({
    recordId,
    legacyId,
    slug: payload.slug,
    title: payload.title,
    excerpt: payload.excerpt,
    status: publishStatus,
    legacyUrl: payload.legacyUrl || null,
    featuredImageUrl: payload.featuredImageUrl,
    publishedAt: payload.publishedAt,
    payload,
  });

  revalidateBlogPaths(payload, previousSlug);
  redirect(`/admin/blog/editar?recordId=${recordId}&saved=1`);
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  if (!hasDatabaseUrl()) {
    redirect("/admin/blog");
  }

  const recordId = String(formData.get("recordId") || "").trim();
  if (!recordId) {
    redirect("/admin/blog");
  }

  const record = await getEditableBlogPostRecordByRecordId(recordId);
  if (record) {
    const payload = record.payload as BlogPost;
    const currentPost = {
      ...payload,
      slug: record.slug || String(payload.slug || ""),
      id: record.legacyId || String(payload.id || record.recordId),
      title: record.title || String(payload.title || ""),
      excerpt: record.excerpt || String(payload.excerpt || ""),
      legacyUrl: record.legacyUrl || payload.legacyUrl || null,
    } as BlogPost;

    await deleteEditableBlogPostRecord(recordId);
    revalidateBlogPaths(currentPost, record.slug);
  }

  redirect("/admin/blog?deleted=1");
}

export async function toggleBlogPostStatusAction(formData: FormData): Promise<void> {
  if (!hasDatabaseUrl()) {
    redirect("/admin/blog");
  }

  const recordId = String(formData.get("recordId") || "").trim();
  const nextStatus = String(formData.get("nextStatus") || "").trim() === "published"
    ? "published"
    : "draft";

  if (!recordId) {
    redirect("/admin/blog");
  }

  const record = await getEditableBlogPostRecordByRecordId(recordId);
  if (!record) {
    redirect("/admin/blog");
  }

  await upsertEditableBlogPostRecord({
    recordId: record.recordId,
    legacyId: record.legacyId,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    status: nextStatus,
    legacyUrl: record.legacyUrl,
    featuredImageUrl: record.featuredImageUrl,
    publishedAt: record.publishedAt,
    payload: record.payload,
  });

  revalidateBlogPaths(record.payload as BlogPost, record.slug);
  redirect("/admin/blog");
}
