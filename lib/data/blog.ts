export interface BlogPost {
    id: string; // Added ID
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML
    date: string;
    author: string;
    image: string;
    tags: string[];
    legacyPath?: string;
    metaTitle?: string;
    metaDescription?: string;
}

// MOCK DATA
// MOCK DATA (Replaced by CSV migration)
import generatedBlogPosts from './generated-blog.json';

export const blogPosts: BlogPost[] = generatedBlogPosts as BlogPost[];

export function getAllPosts(): BlogPost[] {
    return blogPosts;
}

export function getPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug);
}
