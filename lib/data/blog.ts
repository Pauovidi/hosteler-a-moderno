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
}

import generatedBlogPosts from './generated-blog.json';
import visibilityBlog from './visibility-blog.json';

export const blogPosts: BlogPost[] = generatedBlogPosts as BlogPost[];

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

function legacySlugFromUrl(url: string): string {
  const value = String(url || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return lastSegment.replace(/\.html?$/i, "").replace(/^p\d+-/i, "");
  } catch {
    const lastSegment = value.split("/").filter(Boolean).pop() || "";
    return lastSegment.replace(/\.html?$/i, "").replace(/^p\d+-/i, "");
  }
}

const hiddenLegacyUrls = Array.isArray((visibilityBlog as any).hiddenLegacyUrls)
  ? (visibilityBlog as any).hiddenLegacyUrls.map((url: string) => String(url).trim()).filter(Boolean)
  : [];

const hiddenLegacyUrlSet = new Set(hiddenLegacyUrls);
const hiddenSlugSet = new Set(hiddenLegacyUrls.map(legacySlugFromUrl).filter(Boolean));

export function getVisiblePosts(): BlogPost[] {
  return blogPosts.filter((post) => {
    const legacyUrl = String((post as any).legacyUrl || "").trim();
    if (legacyUrl && hiddenLegacyUrlSet.has(legacyUrl)) {
      return false;
    }

    return !hiddenSlugSet.has(String(post.slug || "").trim());
  });
}

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
