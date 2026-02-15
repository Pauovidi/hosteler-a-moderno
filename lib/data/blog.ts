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

export const blogPosts: BlogPost[] = generatedBlogPosts as BlogPost[];

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
