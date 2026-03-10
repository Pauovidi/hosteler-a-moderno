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
  legacyUrl?: string | null;
}

import generatedBlogPosts from './generated-blog.json';
import visibilityBlog from './visibility-blog.json';

export const blogPosts: BlogPost[] = generatedBlogPosts as BlogPost[];

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

function safeLegacyPath(input: string): string {
  const value = String(input || '').trim();
  if (!value) return '';

  try {
    return new URL(value).pathname.replace(/\/+$/g, '');
  } catch {
    const clean = value.split('#')[0].split('?')[0].trim();
    if (!clean) return '';
    if (clean.startsWith('/')) return clean.replace(/\/+$/g, '');
    const parts = clean.split('/').filter(Boolean);
    return parts.length ? `/${parts.join('/')}` : '';
  }
}

function ensureHtmlSuffix(pathname: string): string {
  const value = String(pathname || '').trim();
  if (!value) return value;
  return /\.html?$/i.test(value) ? value : `${value}.html`;
}

function legacySlugFromUrl(url: string): string {
  const value = safeLegacyPath(url);
  if (!value) return '';
  const lastSegment = value.split('/').filter(Boolean).pop() || '';
  return lastSegment.replace(/\.html?$/i, '').replace(/^p\d+-/i, '');
}

const hiddenLegacyUrls = Array.isArray((visibilityBlog as any).hiddenLegacyUrls)
  ? (visibilityBlog as any).hiddenLegacyUrls.map((url: string) => String(url).trim()).filter(Boolean)
  : [];

const hiddenLegacyUrlSet = new Set(hiddenLegacyUrls);
const hiddenLegacyPathSet = new Set(hiddenLegacyUrls.map(safeLegacyPath).filter(Boolean));

export function getVisiblePosts(): BlogPost[] {
  return blogPosts.filter((post) => {
    const legacyUrl = String((post as any).legacyUrl || '').trim();

    if (!legacyUrl) {
      return true;
    }

    if (hiddenLegacyUrlSet.has(legacyUrl)) {
      return false;
    }

    const postPath = safeLegacyPath(legacyUrl);
    if (postPath && hiddenLegacyPathSet.has(postPath)) {
      return false;
    }

    return true;
  });
}

export function getCanonicalBlogPath(post: BlogPost): string {
  const fallback = `/blog/p${post.id}-${post.slug}.html`;
  const legacyPath = safeLegacyPath(String(post.legacyUrl || ''));

  if (!legacyPath.startsWith('/blog/')) {
    return fallback;
  }

  if (/^\/blog\/p/i.test(legacyPath)) {
    return ensureHtmlSuffix(legacyPath);
  }

  if (/^\/blog\/c/i.test(legacyPath)) {
    const corrected = legacyPath.replace(/^\/blog\/c/i, '/blog/p');
    return ensureHtmlSuffix(corrected);
  }

  return fallback;
}

export function resolveBlogPostFromIncoming(incoming: string): BlogPost | undefined {
  const incomingRaw = String(incoming || '').trim();
  if (!incomingRaw) return undefined;

  const incomingNoHtml = incomingRaw.replace(/\.html$/i, '');
  const candidateWithIncoming = `/blog/${incomingRaw}`;
  const candidateWithHtml = `/blog/${incomingNoHtml}.html`;

  const byLegacyPath = blogPosts.find((post) => {
    const legacyPath = safeLegacyPath(String(post.legacyUrl || ''));
    if (!legacyPath) return false;

    return legacyPath === candidateWithIncoming || legacyPath === candidateWithHtml;
  });

  if (byLegacyPath) return byLegacyPath;

  const idMatch = incomingNoHtml.match(/^p(\d+)-/i);
  if (idMatch?.[1]) {
    const byId = blogPosts.find((post) => String(post.id) === String(idMatch[1]));
    if (byId) return byId;
  }

  return blogPosts.find((post) => post.slug === incomingNoHtml);
}

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}