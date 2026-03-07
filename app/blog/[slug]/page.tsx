import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllPosts, type BlogPost } from "@/lib/data/blog";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function normalizeBlogSlug(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/\.html?$/i, "").replace(/^[cp]\d+-/i, "");
}

function canonicalBlogPath(post: BlogPost): string {
  const fallbackSlug = String(post.slug || "").trim().replace(/\.html?$/i, "").replace(/^[cp]\d+-/i, "");

  const rawLegacyUrl = String(post.legacyUrl || "").trim();
  if (rawLegacyUrl) {
    try {
      const pathname = new URL(rawLegacyUrl).pathname;
      if (pathname.startsWith("/blog/") && /\.html?$/i.test(pathname)) {
        return pathname.replace(/^\/blog\/c/i, "/blog/p");
      }
    } catch {
      // fallback below
    }
  }

  return `/blog/p${post.id}-${fallbackSlug}.html`;
}

function cleanPostHtml(html: string, featuredUrl?: string | null): { cleanedHtml: string; shouldRenderFeatured: boolean } {
  let cleaned = String(html || "");
  const normalizedFeatured = String(featuredUrl || "").trim();

  // 1) Eliminar bloque inicial tipo índice en texto plano
  const firstBlocksRegex = /^(?:\s*(?:<p[^>]*>[\s\S]*?<\/p>|<div[^>]*>[\s\S]*?<\/div>|<section[^>]*>[\s\S]*?<\/section>)){1,2}/i;
  const firstBlocksMatch = cleaned.match(firstBlocksRegex);
  if (firstBlocksMatch?.[0]) {
    const blockText = firstBlocksMatch[0]
      .replace(/<[^>]*>/g, "\n")
      .replace(/\u00a0/g, " ")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const shortLines = blockText.filter((line) => line.length <= 120);
    const questionCount = (firstBlocksMatch[0].match(/\?/g) || []).length;

    if (shortLines.length >= 3 && questionCount >= 3) {
      cleaned = cleaned.replace(firstBlocksMatch[0], "").trim();
    }
  }

  // 2) Deduplicar imágenes consecutivas con mismo src al inicio
  cleaned = cleaned.replace(
    /^(\s*(?:<p[^>]*>)?\s*<img[^>]*src=["']([^"']+)["'][^>]*>\s*(?:<\/p>)?\s*)(\s*(?:<p[^>]*>)?\s*<img[^>]*src=["']\2["'][^>]*>\s*(?:<\/p>)?\s*)+/i,
    "$1"
  );

  // 3) No renderizar featured arriba si ya está en el html
  const containsFeatured = normalizedFeatured ? cleaned.includes(normalizedFeatured) : false;

  return {
    cleanedHtml: cleaned,
    shouldRenderFeatured: Boolean(normalizedFeatured) && !containsFeatured,
  };
}

function findPostFromSegment(segment: string): BlogPost | undefined {
  const rawSegment = String(segment || "").trim().replace(/^\/+|\/+$/g, "");
  if (!rawSegment) return undefined;

  const requestedPath = `/blog/${rawSegment}`;
  const posts = getAllPosts();

  // 1) Match exacto por legacyPath (normalizado a p)
  const byLegacyPath = posts.find((post) => canonicalBlogPath(post) === requestedPath.replace(/^\/blog\/c/i, "/blog/p"));
  if (byLegacyPath) return byLegacyPath;

  // 2) Match por prefijo p<ID>-...
  const idMatch = rawSegment.match(/^p(\d+)-(.+?)(?:\.html)?$/i);
  if (idMatch) {
    const [, id] = idMatch;
    const byId = posts.find((post) => String(post.id) === id);
    if (byId) return byId;
  }

  // 3) Fallback por slug sin id ni .html
  const normalizedIncoming = normalizeBlogSlug(rawSegment);
  return posts.find((post) => normalizeBlogSlug(post.slug) === normalizedIncoming);
}

function canonicalAbsolute(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.personalizadoshosteleria.com";
  return new URL(path, baseUrl).toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findPostFromSegment(slug);

  if (!post) {
    return { title: "Artículo no encontrado" };
  }

  const canonicalPath = canonicalBlogPath(post);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: canonicalAbsolute(canonicalPath),
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
      url: canonicalAbsolute(canonicalPath),
    },
  };
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({
    slug: canonicalBlogPath(post).replace(/^\/blog\//, ""),
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = findPostFromSegment(slug);

  if (!post) {
    notFound();
  }

  const canonicalPath = canonicalBlogPath(post);
  const currentPath = `/blog/${slug}`;

  if (currentPath !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const { cleanedHtml, shouldRenderFeatured } = cleanPostHtml(post.contentHtml, post.featuredImageUrl);

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
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-8 leading-tight">{post.title}</h1>

          {shouldRenderFeatured && post.featuredImageUrl ? (
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border mb-6">
              <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover" />
            </div>
          ) : null}

          <div
            className="prose prose-neutral max-w-none prose-p:my-5 prose-li:my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: cleanedHtml }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
