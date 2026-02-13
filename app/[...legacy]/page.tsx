import { notFound } from "next/navigation";

import { buildBaseMetadata } from "@/lib/seo";

// Reuse the already-implemented legacy handlers.
import LegacyCategoryPage, {
  generateMetadata as generateLegacyCategoryMetadata,
} from "@/app/legacy-category/[id]/page";
import LegacyProductPage, {
  generateMetadata as generateLegacyProductMetadata,
} from "@/app/legacy-product/[id]/page";

type Props = {
  params: { legacy: string[] };
};

function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function parseLegacySegment(segment: string):
  | { kind: "c" | "p"; id: string; slug: string }
  | null {
  // Matches:
  //  - c412080-cristaleria-personalizada-hosteleria.html
  //  - p10446447-servilleta-...-qr.html
  const m = segment.match(/^([pc])(\d+)(?:-(.+))?\.html$/i);
  if (!m) return null;

  const kind = m[1].toLowerCase() as "c" | "p";
  const id = m[2];
  const slug = safeDecode(m[3] || "");
  return { kind, id, slug };
}

export async function generateMetadata({ params }: Props) {
  const base = buildBaseMetadata();

  const segment = params?.legacy?.[0];
  if (!segment) return base;

  const parsed = parseLegacySegment(segment);
  if (!parsed) return base;

  const common = {
    params: { id: parsed.id },
    searchParams: { slug: parsed.slug },
  } as any;

  return parsed.kind === "c"
    ? generateLegacyCategoryMetadata(common)
    : generateLegacyProductMetadata(common);
}

export default function LegacyCatchAllPage({ params }: Props) {
  const segment = params?.legacy?.[0];
  if (!segment) return notFound();

  const parsed = parseLegacySegment(segment);
  if (!parsed) return notFound();

  const Comp: any = parsed.kind === "c" ? LegacyCategoryPage : LegacyProductPage;
  return <Comp params={{ id: parsed.id }} searchParams={{ slug: parsed.slug }} />;
}
