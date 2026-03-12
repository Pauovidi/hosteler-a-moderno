import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  getAllPosts,
  getCanonicalBlogPath,
  resolveBlogPostFromIncoming,
} from "@/lib/content/blog-store";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeLeadingIndexBlock(html: string): string {
  let result = String(html || "");

  for (let pass = 0; pass < 2; pass += 1) {
    const match = result.match(/^\s*<(p|div)[^>]*>[\s\S]{0,2200}<\/\1>\s*/i);
    if (!match) break;

    const block = match[0];
    const anchorCount = (block.match(/<a\b[^>]*href=["']#[^"']*["'][^>]*>/gi) || []).length;
    const questionCount = (block.match(/\?/g) || []).length;

    const plainText = block
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const shortLines = plainText.filter((line) => line.length <= 120).length;
    const looksLikeIndex = anchorCount >= 3 || (questionCount >= 2 && shortLines >= 3);

    if (!looksLikeIndex) break;
    result = result.slice(block.length);
  }

  return result;
}

function dedupeLeadingConsecutiveImages(html: string): string {
  const maxScan = 5000;
  const head = html.slice(0, maxScan);
  const tail = html.slice(maxScan);

  let working = head;
  const duplicateImgRegex = /(<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*)(<img\b[^>]*\bsrc=["']\2["'][^>]*>\s*)/i;

  while (duplicateImgRegex.test(working)) {
    working = working.replace(duplicateImgRegex, "$1");
  }

  return `${working}${tail}`;
}

function cleanPostHtml(html: string, featuredUrl?: string): string {
  let cleaned = String(html || "");
  cleaned = removeLeadingIndexBlock(cleaned);
  cleaned = dedupeLeadingConsecutiveImages(cleaned);

  if (featuredUrl) {
    const escaped = escapeRegExp(featuredUrl);
    const duplicateFeaturedRegex = new RegExp(`(<img\\b[^>]*\\bsrc=["']${escaped}["'][^>]*>\\s*)(<img\\b[^>]*\\bsrc=["']${escaped}["'][^>]*>\\s*)`, "i");
    cleaned = cleaned.replace(duplicateFeaturedRegex, "$1");
  }

  return cleaned;
}

function hasFeaturedInsideHtml(cleanedHtml: string, featuredUrl?: string | null): boolean {
  const value = String(featuredUrl || "").trim();
  if (!value) return false;
  return cleanedHtml.includes(value);
}

function toPathSlug(canonicalPath: string): string {
  return canonicalPath.replace(/^\/blog\//, "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await resolveBlogPostFromIncoming(slug);

  if (!post) {
    return {
      title: "Artículo no encontrado",
    };
  }

  const canonicalPath = getCanonicalBlogPath(post);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
      url: canonicalPath,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const uniqueSlugs = new Set(posts.map((post) => toPathSlug(getCanonicalBlogPath(post))));

  return Array.from(uniqueSlugs).map((slug) => ({
    slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await resolveBlogPostFromIncoming(slug);

  if (!post) {
    notFound();
  }

  const canonicalPath = getCanonicalBlogPath(post);
  const incomingPath = `/blog/${slug}`;

  if (incomingPath !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const cleanedHtml = cleanPostHtml(post.contentHtml || "", post.featuredImageUrl || undefined);
  const showFeaturedOnTop = !!post.featuredImageUrl && !hasFeaturedInsideHtml(cleanedHtml, post.featuredImageUrl);

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

          {showFeaturedOnTop ? (
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border mb-6">
              <Image src={post.featuredImageUrl!} alt={post.title} fill className="object-cover" />
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
