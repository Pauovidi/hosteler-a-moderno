import "server-only";

import {
  type BlogPost,
  getAllPosts as getFallbackPosts,
  getCanonicalBlogPath as getFallbackCanonicalBlogPath,
  getPost as getFallbackPost,
  getVisiblePosts as getFallbackVisiblePosts,
  resolveBlogPostFromIncoming as resolveFallbackBlogPostFromIncoming,
} from "@/lib/data/blog";
import { listEditableBlogPosts } from "@/lib/content/db";
import { hasDatabaseUrl } from "@/lib/content/env";
import { renderMarkdownToHtml } from "@/lib/content/markdown";

type BlogMergeResult = {
  posts: BlogPost[];
  ownedSlugs: Set<string>;
};

function normalizeBlogPayload(payload: Record<string, unknown>): BlogPost {
  const raw = payload as Partial<BlogPost> & { contentMarkdown?: string };
  const contentHtml = String(raw.contentHtml || "").trim()
    || renderMarkdownToHtml(String(raw.contentMarkdown || ""));
  const publishedAt = String(raw.publishedAt || new Date().toISOString());
  const updatedAt = String(raw.updatedAt || publishedAt);

  return {
    id: String(raw.id || ""),
    slug: String(raw.slug || ""),
    title: String(raw.title || ""),
    excerpt: String(raw.excerpt || ""),
    contentHtml,
    featuredImageUrl: raw.featuredImageUrl ? String(raw.featuredImageUrl) : null,
    authorName: String(raw.authorName || "Admin"),
    publishedAt,
    updatedAt,
    legacyUrl: raw.legacyUrl ? String(raw.legacyUrl) : null,
  };
}

async function mergePublicBlogPosts(): Promise<BlogMergeResult> {
  const fallbackPosts = getFallbackPosts();

  if (!hasDatabaseUrl()) {
    return {
      posts: fallbackPosts,
      ownedSlugs: new Set<string>(),
    };
  }

  const records = await listEditableBlogPosts();
  if (records.length === 0) {
    return {
      posts: fallbackPosts,
      ownedSlugs: new Set<string>(),
    };
  }

  const merged = new Map(fallbackPosts.map((post) => [post.slug, post]));
  const fallbackByLegacyId = new Map(
    fallbackPosts.map((post) => [String(post.id), post]),
  );
  const ownedSlugs = new Set<string>();

  for (const record of records) {
    const fallbackPost = record.legacyId
      ? fallbackByLegacyId.get(String(record.legacyId))
      : undefined;

    if (fallbackPost) {
      merged.delete(fallbackPost.slug);
    }

    if (record.status !== "published") {
      continue;
    }

    const post = normalizeBlogPayload(record.payload);
    ownedSlugs.add(post.slug);
    merged.set(post.slug, post);
  }

  return {
    posts: Array.from(merged.values()),
    ownedSlugs,
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const result = await mergePublicBlogPosts();
  return result.posts;
}

export async function getVisiblePosts(): Promise<BlogPost[]> {
  const result = await mergePublicBlogPosts();
  const fallbackVisibleSlugs = new Set(getFallbackVisiblePosts().map((post) => post.slug));

  return result.posts.filter((post) => {
    if (result.ownedSlugs.has(post.slug)) {
      return true;
    }
    return fallbackVisibleSlugs.has(post.slug);
  });
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const result = await mergePublicBlogPosts();
  return result.posts.find((post) => post.slug === slug);
}

export async function resolveBlogPostFromIncoming(
  incoming: string,
): Promise<BlogPost | undefined> {
  const result = await mergePublicBlogPosts();
  const incomingRaw = String(incoming || "").trim();
  const incomingNoHtml = incomingRaw.replace(/\.html$/i, "");
  const candidateWithIncoming = `/blog/${incomingRaw}`;
  const candidateWithHtml = `/blog/${incomingNoHtml}.html`;

  const byLegacyPath = result.posts.find((post) => {
    const legacyPath = String(post.legacyUrl || "").trim();
    if (!legacyPath) {
      return false;
    }

    return legacyPath === candidateWithIncoming || legacyPath === candidateWithHtml;
  });

  if (byLegacyPath) {
    return byLegacyPath;
  }

  const idMatch = incomingNoHtml.match(/^p(\d+)-/i);
  if (idMatch?.[1]) {
    const byId = result.posts.find((post) => String(post.id) === String(idMatch[1]));
    if (byId) {
      return byId;
    }
  }

  return result.posts.find((post) => post.slug === incomingNoHtml);
}

export function getCanonicalBlogPath(post: BlogPost): string {
  if (post.legacyUrl) {
    return getFallbackCanonicalBlogPath(post);
  }

  if (/^\d+$/.test(String(post.id || ""))) {
    return `/blog/p${post.id}-${post.slug}.html`;
  }

  return `/blog/${post.slug}`;
}

export function getFallbackEditablePosts(): BlogPost[] {
  return getFallbackPosts();
}

export function getFallbackEditablePostById(id: string): BlogPost | undefined {
  return getFallbackPosts().find((post) => String(post.id) === String(id));
}

export function getFallbackEditablePostBySlug(slug: string): BlogPost | undefined {
  return getFallbackPost(slug);
}

export function resolveFallbackEditableBlogPostFromIncoming(
  incoming: string,
): BlogPost | undefined {
  return resolveFallbackBlogPostFromIncoming(incoming);
}
