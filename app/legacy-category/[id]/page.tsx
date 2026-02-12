import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { WhatsAppButton } from '@/components/whatsapp-button';

import legacyMap from '@/data/legacy-landing-map.json';
import { getAllProducts, Product } from '@/lib/data/products';

type LegacyRule = {
  title: string;
  mode: 'all' | 'exact' | 'contains';
  value?: string;
};

function norm(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function toLegacySlug(p: Product) {
  const id = String(p.id || '');
  const slug = String(p.slug || '');
  const suffix = `-${id}`;
  return slug.endsWith(suffix) ? slug.slice(0, -suffix.length) : slug;
}

function legacyProductHref(p: Product) {
  const id = String(p.id || '');
  const legacySlug = toLegacySlug(p) || 'producto';
  return `/p${id}-${legacySlug}.html`;
}

function getRule(id: string): LegacyRule | undefined {
  const raw: any = (legacyMap as any)[id];
  if (!raw) return undefined;

  // Backwards compatibility: {type:'category', key:'airlaid'}
  if (raw.key && !raw.title) {
    return {
      title: String(raw.key).replace(/-/g, ' ').toUpperCase(),
      mode: 'contains',
      value: String(raw.key),
    };
  }

  return raw as LegacyRule;
}

export async function generateMetadata(
  { params, searchParams }: { params: { id: string }; searchParams?: { slug?: string | string[] } }
): Promise<Metadata> {
  const id = params.id;
  const rule = getRule(id);
  if (!rule) {
    return { title: 'Página no encontrada' };
  }

  const rawSlug = (searchParams as any)?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const canonicalPath = `/c${id}-${slug || 'categoria'}.html`;
  const canonical = `https://www.personalizadoshosteleria.com${canonicalPath}`;

  return {
    title: `${rule.title} | Personalizados Hosteleria`,
    description: `Descubre nuestra selección de ${rule.title}.`,
    alternates: { canonical },
    openGraph: {
      title: `${rule.title} | Personalizados Hosteleria`,
      url: canonical,
    },
  };
}

export default async function LegacyCategoryPage(
  { params }: { params: { id: string }; searchParams?: { slug?: string | string[] } }
) {
  const id = params.id;
  const rule = getRule(id);
  if (!rule) return notFound();

  const products = getAllProducts();

  const filtered = products.filter((p) => {
    if (rule.mode === 'all') return true;
    const value = norm(rule.value || '');
    if (!value) return false;
    const cats = (p.categoriesFlat || []).map(norm);
    if (rule.mode === 'exact') return cats.some((c) => c === value);
    return cats.some((c) => c.includes(value));
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            {rule.title}
          </h1>
          <p className="text-muted-foreground mb-10">
            {filtered.length} producto{filtered.length === 1 ? '' : 's'}
          </p>

          {filtered.length === 0 ? (
            <div className="border border-border p-6 bg-muted/30">
              <p className="text-muted-foreground">
                No hay productos disponibles para esta colección todavía.
              </p>
              <div className="mt-4">
                <Link href="/presupuesto" className="text-gold font-display underline">
                  Solicitar presupuesto
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <Link key={p.slug} href={legacyProductHref(p)}>
                  <div className="group border border-border hover:border-gold/30 transition-all bg-card">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={p.image || '/placeholder.svg'}
                        alt={p.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-display text-sm text-foreground group-hover:text-gold transition-colors text-center">
                        {p.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
