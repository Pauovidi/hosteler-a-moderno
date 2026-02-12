"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Product, getAllProducts } from "@/lib/data/products";

interface ProductClientProps {
  product: Product;
  categoria: string;
}

function legacyProductHref(p: Product): string {
  const id = p.id;
  const raw = p.slug || "";
  const legacySlug = raw.replace(new RegExp(`-${id}$`), "") || raw;
  return `/p${id}-${legacySlug}.html`;
}

export default function ProductClient({ product, categoria }: ProductClientProps) {
  // Get other products for "Related Products" section
  const otherProducts = getAllProducts().filter((p) => p.slug !== categoria);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <Link
            href="/c415714-productos-personalizados.html"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-square relative border border-border">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
              {product.brands && (
                <div className="mt-4 p-4 bg-muted border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Colaboramos con:</p>
                  <p className="font-display text-foreground">{product.brands.join(" - ")}</p>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
                Personalización Premium
              </p>

              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-6">{product.title}</h1>

              <div
                className="text-muted-foreground text-lg mb-8 leading-relaxed prose prose-stone max-w-none"
                dangerouslySetInnerHTML={{ __html: product.longDescription }}
              />

              {/* Variants Table */}
              {product.options && product.options.length > 0 && (
                <div className="mb-8 border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-3 border-b border-border">
                    <h3 className="font-display text-foreground">Opciones Disponibles</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm item-center">
                      <thead className="bg-background">
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-left font-display text-muted-foreground">
                            Cantidad / Variante
                          </th>
                          <th className="px-4 py-3 text-right font-display text-muted-foreground">
                            Precio Unitario
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {product.options.map((option, idx) => {
                          const displayPrice = option.effectivePrice && option.effectivePrice > 0
                            ? option.effectivePrice
                            : option.price && option.price > 0
                              ? option.price
                              : product.price && product.price > 0
                                ? product.price
                                : null;

                          return (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 text-foreground">{option.label}</td>
                              <td className="px-4 py-3 text-right text-foreground font-medium">
                                {displayPrice !== null
                                  ? new Intl.NumberFormat("es-ES", {
                                      style: "currency",
                                      currency: "EUR",
                                    }).format(displayPrice)
                                  : (
                                    <span className="text-muted-foreground italic text-xs">Solicitar presupuesto</span>
                                  )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <p className="font-display text-foreground mb-4">Características:</p>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link href="/presupuesto">
                  <Button
                    size="lg"
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider w-full sm:w-auto"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Pedir Presupuesto
                  </Button>
                </Link>
                <a href="https://wa.me/34XXXXXXXXX" target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gold text-foreground hover:bg-gold/10 font-display tracking-wider w-full sm:w-auto bg-transparent"
                  >
                    Contactar por WhatsApp
                  </Button>
                </a>
              </div>

              <p className="text-muted-foreground text-sm">
                * Solicite presupuesto sin compromiso. Respuesta en menos de 24h laborables.
              </p>
            </motion.div>
          </div>

          {/* Related Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20"
          >
            <h2 className="font-display text-2xl text-foreground mb-8 text-center">
              Otros Productos que Pueden Interesarle
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {otherProducts.map((prod) => (
                <Link key={prod.slug} href={legacyProductHref(prod)}>
                  <div className="group border border-border hover:border-gold/30 transition-all">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={prod.image || "/placeholder.svg"}
                        alt={prod.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-display text-sm text-foreground group-hover:text-gold transition-colors text-center">
                        {prod.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
