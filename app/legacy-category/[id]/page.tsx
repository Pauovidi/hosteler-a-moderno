import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllProducts, type Product } from "@/lib/data/products";
import { buildBaseMetadata } from "@/lib/seo";
import { resolveLegacyMenuRule } from "@/data/legacy-menu-map";

type PageProps = {
  params: { id: string };
  searchParams?: { slug?: string };
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-personalizados-hosteleria.vercel.app";

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildHaystack(p: Product): string {
  return normalizeText(
    [
      p.title,
      p.slug,
      p.shortDescription ? stripHtml(p.shortDescription) : "",
      p.longDescription ? stripHtml(p.longDescription) : "",
      ...(p.categoriesFlat ?? []),
      ...(p.categoryPaths ?? []),
      ...(p.brands ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function legacySlugFromProduct(p: Product): string {
  return (p.title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function humanizeLegacySlug(slug: string): string {
  const clean = slug.replace(/\.html$/i, "").replace(/[-_]+/g, " ").trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function filterByLegacyRule(all: Product[], idNum: number, legacySlug?: string): { title: string; products: Product[] } {
  const rule = resolveLegacyMenuRule(idNum);

  // 1) Con regla: filtra internamente (independiente del slug)
  if (rule) {
    if (rule.mode === "all") {
      return { title: rule.title, products: all };
    }

    const includes = (rule.include ?? []).map(normalizeText).filter(Boolean);
    const excludes = (rule.exclude ?? []).map(normalizeText).filter(Boolean);

    const products = all.filter((p) => {
      const hay = buildHaystack(p);
      const includeOk = includes.length === 0 ? true : includes.some((t) => hay.includes(t));
      const excludeHit = excludes.some((t) => hay.includes(t));
      return includeOk && !excludeHit;
    });

    // Si algo raro deja la lista vacía, caemos al fallback por slug para no servir una página "rota".
    if (products.length > 0) return { title: rule.title, products };
  }

  // 2) Sin regla (o lista vacía): fallback por tokens del slug legacy
  const slugTokens = legacySlug
    ? normalizeText(legacySlug)
        .split(" ")
        .filter((t) => t.length >= 4)
    : [];

  if (slugTokens.length === 0) {
    return { title: rule?.title ?? "Productos", products: all };
  }

  const products = all.filter((p) => {
    const hay = buildHaystack(p);
    return slugTokens.some((t) => hay.includes(t));
  });

  return {
    title: rule?.title ?? humanizeLegacySlug(legacySlug ?? "Productos"),
    products: products.length > 0 ? products : all,
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const id = String(params.id);
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return {};

  const legacySlug = searchParams?.slug || "";
  const all = getAllProducts();
  const { title } = filterByLegacyRule(all, idNum, legacySlug);

  const canonicalPath = `/c${id}-${legacySlug || "productos"}.html`;
  const canonical = `${SITE_URL}${canonicalPath}`;

  const base = buildBaseMetadata();

  return {
    ...base,
    title,
    description: `Catálogo de ${title} en Personalizados Hostelería.`,
    alternates: { canonical },
    openGraph: {
      ...(base.openGraph ?? {}),
      title,
      description: `Catálogo de ${title} en Personalizados Hostelería.`,
      url: canonical,
    },
  };
}

export default async function LegacyCategoryPage({ params, searchParams }: PageProps) {
  const id = String(params.id);
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) notFound();

  const legacySlug = searchParams?.slug || "";

  const all = getAllProducts();
  const { title, products } = filterByLegacyRule(all, idNum, legacySlug);

  if (!products || products.length === 0) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3">{title}</h1>
              <p className="text-muted-foreground">Mostrando {products.length} productos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const pSlug = legacySlugFromProduct(product);
                const href = `/p${product.id}-${pSlug}.html`;

                return (
                  <Link
                    key={product.id}
                    href={href}
                    className="group border border-border rounded-2xl overflow-hidden bg-background hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square bg-muted">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-contain p-6 group-hover:scale-[1.02] transition-transform"
                        />
                      ) : null}
                    </div>

                    <div className="p-6">
                      <h2 className="font-display text-xl text-foreground mb-2 line-clamp-2">{product.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {product.shortDescription ? stripHtml(product.shortDescription) : ""}
                      </p>

                      <div className="mt-4 text-sm font-medium text-foreground">Consultar</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
