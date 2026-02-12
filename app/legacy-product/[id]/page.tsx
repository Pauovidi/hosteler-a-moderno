import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getProductById, toLegacySlug } from '@/lib/data/products';

export async function generateMetadata(
  { params, searchParams }: { params: { id: string }; searchParams?: { slug?: string | string[] } }
): Promise<Metadata> {
  const id = params.id;
  const product = getProductById(id);

  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const rawSlug = (searchParams as any)?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const legacySlug = slug || toLegacySlug(product) || 'producto';

  const canonicalPath = `/p${id}-${legacySlug}.html`;
  const canonical = `https://www.personalizadoshosteleria.com${canonicalPath}`;

  const desc = product.shortDescriptionHtml || product.descriptionHtml || '';

  return {
    title: `${product.title} | Personalizados Hostelería`,
    description: product.title,
    alternates: { canonical },
    openGraph: {
      title: product.title,
      description: product.title,
      url: canonical,
      images: product.image ? [{ url: product.image, alt: product.title }] : undefined,
    },
  };
}

export default async function LegacyProductPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const product = getProductById(id);
  if (!product) return notFound();

  const price = typeof product.price === 'number' ? product.price : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6">
            <Link href="javascript:history.back()" className="text-muted-foreground hover:text-foreground">
              ← Volver
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="border border-border rounded-lg overflow-hidden bg-muted">
              <div className="aspect-square relative">
                <Image
                  src={product.image || '/placeholder.svg'}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                {product.title}
              </h1>

              {price > 0 ? (
                <p className="text-2xl font-display text-foreground mb-6">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)}
                </p>
              ) : (
                <p className="text-xl font-display text-foreground mb-6">
                  Solicitar presupuesto
                </p>
              )}

              {product.shortDescriptionHtml ? (
                <div
                  className="prose prose-sm max-w-none text-foreground/90 mb-6"
                  dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
                />
              ) : null}

              <div className="flex gap-3 mb-8">
                <Link href="/presupuesto">
                  <button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-6 py-3 rounded-md">
                    Pedir presupuesto
                  </button>
                </Link>
                <a
                  href="tel:+34XXXXXXXXX"
                  className="border border-border hover:border-gold/40 font-display tracking-wider px-6 py-3 rounded-md"
                >
                  Llamar
                </a>
              </div>

              {product.options?.length ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-3 font-display">
                    Opciones disponibles
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background">
                        <tr className="text-left">
                          <th className="px-4 py-3 border-b border-border">Opción</th>
                          <th className="px-4 py-3 border-b border-border">Precio</th>
                          <th className="px-4 py-3 border-b border-border">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.options.map((o, idx) => {
                          const p = typeof o.effectivePrice === 'number' ? o.effectivePrice : 0;
                          return (
                            <tr key={idx} className="border-b border-border/60">
                              <td className="px-4 py-3">{o.label}</td>
                              <td className="px-4 py-3">
                                {p > 0
                                  ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p)
                                  : 'Consultar'}
                              </td>
                              <td className="px-4 py-3">{o.stock ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {product.descriptionHtml ? (
            <div className="mt-12">
              <h2 className="font-display text-2xl text-foreground mb-4">Descripción</h2>
              <div
                className="prose max-w-none text-foreground/90"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
