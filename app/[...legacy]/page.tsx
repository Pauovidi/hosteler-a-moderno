import { notFound } from "next/navigation";
import type { Metadata } from "next";

import LegacyCategoryPage from "@/app/legacy-category/[id]/page";
import LegacyProductPage from "@/app/legacy-product/[id]/page";

import { buildBaseMetadata, buildProductMetadata } from "@/lib/seo";
import { getProductById } from "@/lib/data/products";

type Props = {
  params: Promise<{ legacy: string[] }>;
};

function parseLegacy(segments: string[]) {
  const raw = (segments?.[0] || "").trim();

  const m = raw.match(/^([cp])(\d+)(?:-(.+?))?\.html?$/i);
  if (!m) return null;

  return {
    kind: m[1].toLowerCase() as "c" | "p",
    id: m[2],
    slug: (m[3] || "").replace(/\.html?$/i, ""),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = buildBaseMetadata();
  const resolvedParams = await params;
  const parsed = parseLegacy(resolvedParams.legacy);

  if (!parsed) return base;

  const { kind, id, slug } = parsed;
  const canonical = kind === "c" ? `/c${id}-${slug}.html` : `/p${id}-${slug}.html`;

  if (kind === "c") {
    const title = slug ? slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ") : "Catálogo";

    return {
      ...base,
      title: `${title} | Personalizados Hosteleria`,
      description: `Descubre ${title.toLowerCase()} en Personalizados Hosteleria.`,
      alternates: { canonical },
      openGraph: {
        ...(base.openGraph || {}),
        title: `${title} | Personalizados Hosteleria`,
        description: `Descubre ${title.toLowerCase()} en Personalizados Hosteleria.`,
        url: canonical,
      },
    };
  }

  const product = getProductById(id);
  if (!product) return base;

  const productMeta = buildProductMetadata(product);

  return {
    ...base,
    ...productMeta,
    alternates: {
      ...(productMeta.alternates || {}),
      canonical,
    },
    openGraph: {
      ...(productMeta.openGraph || {}),
      url: canonical,
    },
  };
}

export default async function LegacyCatchAllPage({ params }: Props) {
  const resolvedParams = await params;
  const parsed = parseLegacy(resolvedParams.legacy);

  if (!parsed) notFound();

  const { kind, id, slug } = parsed;

  if (kind === "c") {
    return <LegacyCategoryPage params={{ id }} searchParams={{ slug }} />;
  }

  return <LegacyProductPage params={{ id }} searchParams={{ slug }} />;
}
