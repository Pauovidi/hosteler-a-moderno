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

function normalizeLegacyPath(input: string): string {
  const value = String(input || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    return parsed.pathname.replace(/\/+$/, "");
  } catch {
    const safe = value.split("#")[0].split("?")[0].trim();
    if (!safe) return "";
    if (safe.startsWith("/")) return safe.replace(/\/+$/, "");
    const parts = safe.split("/").filter(Boolean);
    return parts.length ? `/${parts.join("/")}` : "";
  }
}

const hiddenLegacyUrls = Array.isArray((visibilityBlog as any).hiddenLegacyUrls)
  ? (visibilityBlog as any).hiddenLegacyUrls.map((url: string) => String(url).trim()).filter(Boolean)
  : [];

const hiddenLegacyUrlSet = new Set(hiddenLegacyUrls);
const hiddenLegacyPathSet = new Set(hiddenLegacyUrls.map(normalizeLegacyPath).filter(Boolean));

export function getVisiblePosts(): BlogPost[] {
  return blogPosts.filter((post) => {
    const legacyUrl = String((post as any).legacyUrl || "").trim();

    if (!legacyUrl) {
      return true;
    }

    if (hiddenLegacyUrlSet.has(legacyUrl)) {
      return false;
    }

    const postPath = normalizeLegacyPath(legacyUrl);
    if (postPath && hiddenLegacyPathSet.has(postPath)) {
      return false;
    }

    return true;
  });
}

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}