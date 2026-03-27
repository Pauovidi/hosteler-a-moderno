import type { BlogPost } from "@/lib/data/blog";
import { notFound } from "next/navigation";

import { BlogForm } from "@/components/admin/blog-form";
import {
  deleteBlogPostAction,
  saveBlogPostAction,
} from "@/app/admin/(protected)/blog/actions";
import {
  getEditableBlogPostRecordByLegacyId,
  getEditableBlogPostRecordByRecordId,
} from "@/lib/content/db";
import { getFallbackEditablePostById } from "@/lib/content/blog-store";

export default async function AdminBlogEditPage({
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
    ? await getEditableBlogPostRecordByRecordId(params.recordId)
    : params.legacyId
      ? await getEditableBlogPostRecordByLegacyId(params.legacyId)
      : null;

  const fallbackPost = params.legacyId
    ? getFallbackEditablePostById(params.legacyId)
    : record?.legacyId
      ? getFallbackEditablePostById(record.legacyId)
      : undefined;

  const basePost =
    record?.payload && Object.keys(record.payload).length > 0
      ? (record.payload as BlogPost & { contentMarkdown?: string })
      : fallbackPost;

  if (!record && !fallbackPost) {
    notFound();
  }

  if (!basePost) {
    notFound();
  }

  return (
    <BlogForm
      record={record}
      basePost={basePost}
      searchParams={params}
      saveAction={saveBlogPostAction}
      deleteAction={deleteBlogPostAction}
    />
  );
}
