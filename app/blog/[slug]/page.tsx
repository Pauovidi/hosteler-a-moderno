import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { findPostFromBlogSegment, getAllPosts, getBlogPostHref } from "@/lib/data/blog";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface Props {
    params: Promise<{ slug: string }>;
}

function canonicalFromPath(path: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.personalizadoshosteleria.com";
    return new URL(path, baseUrl).toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = findPostFromBlogSegment(slug);

    if (!post) {
        return {
            title: "Artículo no encontrado",
        };
    }

    const canonicalPath = getBlogPostHref(post);

    return {
        title: post.title,
        description: post.excerpt,
        alternates: {
            canonical: canonicalFromPath(canonicalPath),
        },
        openGraph: {
            type: "article",
            title: post.title,
            description: post.excerpt,
            publishedTime: post.publishedAt,
            authors: [post.authorName],
            url: canonicalFromPath(canonicalPath),
        },
    };
}

export async function generateStaticParams() {
    const posts = getAllPosts();
    return posts.map((post) => ({
        slug: getBlogPostHref(post).replace(/^\/blog\//, ""),
    }));
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = findPostFromBlogSegment(slug);

    if (!post) {
        notFound();
    }

    const canonicalPath = getBlogPostHref(post);
    const currentPath = `/blog/${slug}`;

    if (currentPath !== canonicalPath) {
        permanentRedirect(canonicalPath);
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-32 pb-20 container mx-auto px-4 max-w-4xl">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al blog
                </Link>

                <article>
                    <h1 className="text-4xl md:text-5xl font-display text-foreground mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-12 pb-8 border-b border-border">
                        <span>{new Date(post.publishedAt).toLocaleDateString("es-ES")}</span>
                        <span>•</span>
                        <span>{post.authorName}</span>
                    </div>

                    {post.featuredImageUrl ? (
                        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border mb-6">
                            <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover" />
                        </div>
                    ) : null}

                    <div className="prose prose-neutral max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }} />
                </article>
            </main>
            <Footer />
        </div>
    );
}
