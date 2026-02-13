import { notFound } from "next/navigation";

// Reutilizamos las páginas internas (mantienes UI + SEO en un solo sitio)
import LegacyCategoryPage, {
  generateMetadata as generateLegacyCategoryMetadata,
} from "@/app/legacy-category/[id]/page";

import LegacyProductPage, {
  generateMetadata as generateLegacyProductMetadata,
} from "@/app/legacy-product/[id]/page";

type Props = {
  params: Promise<{ legacy: string[] }>;
};

function parseLegacySegment(
  segment: string
):
  | { kind: "c"; id: string; slug: string }
  | { kind: "p"; id: string; slug: string }
  | null {
  // /c412083-servilletas-para-hosteleria-personalizadas.html
  // /p10446447-servilleta-airlaid-....html
  const match = segment.match(/^([cp])(\d+)(?:-(.*))?\.html$/i);
  if (!match) return null;

  const kind = match[1].toLowerCase() as "c" | "p";
  const id = match[2];
  const rawSlug = match[3] || "";

  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // ignore
  }

  return { kind, id, slug };
}

export async function generateMetadata({ params }: Props) {
  const { legacy } = await params;
  const segment = legacy?.[0];
  if (!segment) return {};

  const parsed = parseLegacySegment(segment);
  if (!parsed) return {};

  if (parsed.kind === "c") {
    return generateLegacyCategoryMetadata({
      params: Promise.resolve({ id: parsed.id }),
      searchParams: Promise.resolve({ slug: parsed.slug }),
    } as any);
  }

  return generateLegacyProductMetadata({
    params: Promise.resolve({ id: parsed.id }),
    searchParams: Promise.resolve({ slug: parsed.slug }),
  } as any);
}

export default async function LegacyEntryPage({ params }: Props) {
  const { legacy } = await params;
  const segment = legacy?.[0];
  if (!segment) notFound();

  const parsed = parseLegacySegment(segment);
  if (!parsed) notFound();

  if (parsed.kind === "c") {
    return (
      <LegacyCategoryPage
        params={Promise.resolve({ id: parsed.id })}
        searchParams={Promise.resolve({ slug: parsed.slug })}
      />
    );
  }

  return (
    <LegacyProductPage
      params={Promise.resolve({ id: parsed.id })}
      searchParams={Promise.resolve({ slug: parsed.slug })}
    />
  );
}
