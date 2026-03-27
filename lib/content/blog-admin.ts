import type { BlogPost } from "@/lib/data/blog";
import { slugify } from "@/lib/utils";
import { renderMarkdownToHtml } from "@/lib/content/markdown";

function toDateTimeLocalValue(value: string | null | undefined): string {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString();
  return iso.slice(0, 16);
}

function fromDateTimeLocal(value: string): string | null {
  const input = String(value || "").trim();
  if (!input) {
    return null;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function createBlankBlogPost(recordId: string, slug: string, title: string): BlogPost {
  const now = new Date().toISOString();

  return {
    id: recordId,
    slug,
    title,
    excerpt: "",
    contentHtml: "",
    featuredImageUrl: null,
    authorName: "Admin",
    publishedAt: now,
    updatedAt: now,
    legacyUrl: null,
  };
}

export function buildBlogPayloadFromForm(input: {
  formData: FormData;
  recordId: string;
  legacyId: string | null;
  basePost?: BlogPost;
  uploadedImageUrl?: string | null;
}): BlogPost & { contentMarkdown: string } {
  const title = String(input.formData.get("title") || "").trim();
  const basePost =
    input.basePost ||
    createBlankBlogPost(input.legacyId || input.recordId, "", title);
  const isLegacyPost = Boolean(input.legacyId);
  const slugInput = String(input.formData.get("slug") || "").trim();
  const slug = isLegacyPost
    ? basePost.slug
    : slugInput || slugify(title || basePost.title || input.recordId);
  const contentMarkdown = String(input.formData.get("contentMarkdown") || "");
  const publishedAt =
    fromDateTimeLocal(String(input.formData.get("publishedAt") || "")) ||
    basePost.publishedAt ||
    new Date().toISOString();
  const featuredImageUrl =
    input.uploadedImageUrl ||
    String(input.formData.get("featuredImageUrl") || "").trim() ||
    basePost.featuredImageUrl ||
    null;
  const legacyUrl = isLegacyPost
    ? basePost.legacyUrl || null
    : String(input.formData.get("legacyUrl") || "").trim() || null;

  return {
    ...basePost,
    id: input.legacyId || basePost.id || input.recordId,
    slug,
    title,
    excerpt: String(input.formData.get("excerpt") || "").trim(),
    contentHtml: renderMarkdownToHtml(contentMarkdown),
    contentMarkdown,
    featuredImageUrl,
    authorName: String(input.formData.get("authorName") || "").trim() || "Admin",
    publishedAt,
    updatedAt: new Date().toISOString(),
    legacyUrl,
  };
}

export function serializeBlogPostForForm(post: BlogPost & { contentMarkdown?: string }) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    contentMarkdown: String(post.contentMarkdown || post.contentHtml || ""),
    featuredImageUrl: String(post.featuredImageUrl || ""),
    authorName: String(post.authorName || ""),
    publishedAt: toDateTimeLocalValue(post.publishedAt),
    legacyUrl: String(post.legacyUrl || ""),
  };
}
