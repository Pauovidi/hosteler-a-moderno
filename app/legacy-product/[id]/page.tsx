import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getProductById } from "@/lib/data/products";
import { buildBaseMetadata, buildProductMetadata } from "@/lib/seo";

import ProductClient from "@/app/producto/[categoria]/product-client";

type PageProps = {
  params: { id: string };
  searchParams?: { slug?: string };
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-personalizados-hosteleria.vercel.app";

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) return {};

  const product = getProductById(idNum);
  if (!product) return buildBaseMetadata();

  const legacySlug = searchParams?.slug || "";
  const canonicalPath = `/p${product.id}-${legacySlug || product.slug}.html`;
  const canonical = `${SITE_URL}${canonicalPath}`;

  const base = buildProductMetadata(product);

  return {
    ...base,
    alternates: { canonical },
    openGraph: {
      ...(base.openGraph ?? {}),
      url: canonical,
    },
  };
}

export default async function LegacyProductPage({ params }: PageProps) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) notFound();

  const product = getProductById(idNum);
  if (!product) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <ProductClient product={product} categoria={product.slug} />
      </main>
      <Footer />
    </div>
  );
}
