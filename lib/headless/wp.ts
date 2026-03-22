import "server-only";

import { HEADLESS_CACHE_TAGS } from "@/lib/headless/constants";
import { getHeadlessRevalidateSeconds, getWordPressBaseUrl } from "@/lib/headless/env";
import type { HeadlessBlogPostRecord } from "@/lib/headless/types";

type WordPressRendered = {
  rendered?: string;
};

type WordPressPost = {
  id: number;
  slug: string;
  date_gmt?: string;
  modified_gmt?: string;
  title?: WordPressRendered;
  excerpt?: WordPressRendered;
  content?: WordPressRendered;
  yoast_head_json?: {
    og_image?: Array<{ url?: string }>;
  };
  _embedded?: {
    author?: Array<{ name?: string }>;
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
  };
};

function getWordPressApiBaseUrl(): string {
  const baseUrl = getWordPressBaseUrl();
  if (!baseUrl) {
    throw new Error("WP_BASE_URL no está configurada.");
  }

  return `${baseUrl}/wp-json/wp/v2`;
}

async function fetchWordPressPosts(): Promise<WordPressPost[]> {
  const items: WordPressPost[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`${getWordPressApiBaseUrl()}/posts`);
    url.searchParams.set("status", "publish");
    url.searchParams.set("_embed", "1");
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "100");

    const response = await fetch(url, {
      next: {
        revalidate: getHeadlessRevalidateSeconds(),
        tags: [HEADLESS_CACHE_TAGS.posts],
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress posts devolvió ${response.status}.`);
    }

    const batch = (await response.json()) as WordPressPost[];
    items.push(...batch);

    if (batch.length < 100) {
      break;
    }

    page += 1;
  }

  return items;
}

function stripHtml(html: string): string {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function getWordPressPosts(): Promise<HeadlessBlogPostRecord[]> {
  const posts = await fetchWordPressPosts();

  return posts.map((post) => ({
    id: String(post.id),
    slug: String(post.slug || ""),
    title: String(post.title?.rendered || ""),
    excerpt: stripHtml(String(post.excerpt?.rendered || "")),
    contentHtml: String(post.content?.rendered || ""),
    featuredImageUrl:
      String(post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || post.yoast_head_json?.og_image?.[0]?.url || "").trim()
      || null,
    authorName: String(post._embedded?.author?.[0]?.name || "WordPress"),
    publishedAt: String(post.date_gmt || new Date().toISOString()),
    updatedAt: String(post.modified_gmt || post.date_gmt || new Date().toISOString()),
    legacyUrl: null,
    source: "wp",
  }));
}
