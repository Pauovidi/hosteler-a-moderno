import type { BlogPost } from "@/lib/data/blog";

import { BlogForm } from "@/components/admin/blog-form";
import {
  deleteBlogPostAction,
  saveBlogPostAction,
} from "@/app/admin/(protected)/blog/actions";

export default async function AdminBlogNewPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const now = new Date().toISOString();
  const emptyPost: BlogPost & { contentMarkdown?: string } = {
    id: `post-${crypto.randomUUID()}`,
    slug: "",
    title: "",
    excerpt: "",
    contentHtml: "",
    contentMarkdown: "",
    featuredImageUrl: null,
    authorName: "Admin",
    publishedAt: now,
    updatedAt: now,
    legacyUrl: null,
  };

  return (
    <BlogForm
      record={null}
      basePost={emptyPost}
      searchParams={params}
      saveAction={saveBlogPostAction}
      deleteAction={deleteBlogPostAction}
    />
  );
}
