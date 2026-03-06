export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  featuredImageUrl: string | null;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  legacyUrl?: string;
}

import generatedBlogPosts from './generated-blog.json';
import visibilityBlog from './visibility-blog.json';

export const blogPosts: BlogPost[] = generatedBlogPosts as BlogPost[];

function normalizeSlug(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function safeUrlPathname(input: string): string {
  const value = String(input || "").trim();
  if (!value) return "";

  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function legacySlugFromPath(pathname: string): string {
  const lastSegment = String(pathname || "").split("/").filter(Boolean).pop() || "";
  return lastSegment.replace(/\.html?$/i, "").replace(/^[cp]\d+-/i, "");
}

export function getLegacyPathFromPost(post: BlogPost): string | null {
  const legacyPath = safeUrlPathname(String(post.legacyUrl || "")).trim();
  if (legacyPath.startsWith("/blog/")) {
    return legacyPath;
  }

  const id = String(post.id || "").trim();
  const slug = String(post.slug || "").trim().replace(/\.html?$/i, "").replace(/^[cp]\d+-/i, "");
  if (!slug) return null;
  if (!id) return `/blog/${slug}`;

  return `/blog/c${id}-${slug}.html`;
}

export function getBlogPostHref(post: BlogPost): string {
  return getLegacyPathFromPost(post) || `/blog/${post.slug}`;
}

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

const hiddenLegacyUrls = Array.isArray((visibilityBlog as any).hiddenLegacyUrls)
  ? (visibilityBlog as any).hiddenLegacyUrls.map((url: string) => String(url).trim()).filter(Boolean)
  : [];

const hiddenLegacyPathSet = new Set(hiddenLegacyUrls.map((url) => safeUrlPathname(url)).filter(Boolean));
const hiddenSlugSet = new Set(hiddenLegacyUrls.map((url) => legacySlugFromPath(safeUrlPathname(url))).filter(Boolean));

export function getVisiblePosts(): BlogPost[] {
  return blogPosts.filter((post) => {
    const legacyPath = getLegacyPathFromPost(post);
    if (legacyPath && hiddenLegacyPathSet.has(legacyPath)) {
      return false;
    }

    return !hiddenSlugSet.has(normalizeSlug(post.slug));
  });
}

export function findPostFromBlogSegment(segment: string): BlogPost | undefined {
  const rawSegment = String(segment || "").trim().replace(/^\/+|\/+$/g, "");
  if (!rawSegment) return undefined;

  const requestedPath = `/blog/${rawSegment}`;

  const exactLegacyPathMatch = blogPosts.find((post) => getLegacyPathFromPost(post) === requestedPath);
  if (exactLegacyPathMatch) {
    return exactLegacyPathMatch;
  }

  const legacyPattern = rawSegment.match(/^[cp](\d+)-(.+)\.html$/i);
  if (legacyPattern) {
    const [, legacyId, legacySlug] = legacyPattern;
    const byIdAndSlug = blogPosts.find((post) =>
      String(post.id || "").trim() === legacyId && normalizeSlug(post.slug) === normalizeSlug(legacySlug)
    );

    if (byIdAndSlug) {
      return byIdAndSlug;
    }
  }

  const normalizedSegment = normalizeSlug(rawSegment.replace(/\.html?$/i, "").replace(/^[cp]\d+-/i, ""));

  return blogPosts.find((post) => normalizeSlug(post.slug) === normalizedSegment);
}

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
