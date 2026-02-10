"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductData {
  title: string;
  description: string;
  image: string;
  features: string[];
  brands?: string[];
}

const productData: Record<string, ProductData> = {
  servilletas: {
    title: "Servilletas Personalizadas",
    description: "Servilletas de papel y tela con su logo para crear una imagen de marca coherente en su establecimiento. Disponibles en multiples tamanos, colores y calidades.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/servilletas-personalizadas.png",
    features: [
      "Impresion a todo color con tintas ecologicas",
      "Multiples tamanos: cocktail, almuerzo, cena",
      "Papel reciclado y certificado FSC disponible",
      "Minimos desde 1.000 unidades",
      "Entrega en 10-15 dias laborables",
    ],
  },
  cristaleria: {
    title: "Cristaleria Personalizada",
    description: "Copas, vasos y jarras grabados con su marca. Trabajamos con los mejores fabricantes europeos para garantizar la maxima calidad y durabilidad.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-personalizadas.png",
    features: [
      "Grabado laser de alta precision",
      "Serigrafia a fuego permanente",
      "Cristal templado resistente a lavavajillas industrial",
      "Disenos exclusivos para su marca",
      "Asesoramiento en normativa hosteleria",
    ],
    brands: ["Arcoroc", "Bormioli", "Stoelzle"],
  },
  vajilla: {
    title: "Vajilla Personalizada",
    description: "Platos, tazas y platillos con su identidad corporativa. Porcelana de primera calidad europea con personalizacion duradera.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-vasos-jarras-todo-personalizado.png",
    features: [
      "Porcelana reforzada para uso intensivo",
      "Personalizacion con calcomanía vitrificable",
      "Resistente a microondas y lavavajillas",
      "Amplia gama de formas y tamanos",
      "Reposicion garantizada durante anos",
    ],
  },
  cuberteria: {
    title: "Cuberteria Personalizada",
    description: "Cubiertos de acero inoxidable grabados con laser. Modelos exclusivos 18/10 con acabados premium para establecimientos de alta categoria.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-4.png",
    features: [
      "Acero inoxidable 18/10 de alta calidad",
      "Grabado laser permanente",
      "Multiples disenos y acabados",
      "Resistente a uso intensivo",
      "Packaging personalizado opcional",
    ],
  },
  textil: {
    title: "Contract Textil Hoteles",
    description: "Soluciones textiles completas para hoteles: sabanas, toallas, mantelerias personalizadas con bordado o estampacion de alta calidad.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/soluciones-textiles-para-hoteles-3.png",
    features: [
      "Algodon 100% de primera calidad",
      "Bordado computerizado de alta definicion",
      "Estampacion textil duradera",
      "Programa de reposicion continua",
      "Cumplimiento normativa hotelera",
    ],
  },
};

export default function ProductoPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = use(params);
  const product = productData[categoria];

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="font-display text-2xl text-foreground mb-4">Producto no encontrado</h1>
            <Link href="/">
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <Link
            href="/#productos"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a productos
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
                  <p className="font-display text-foreground">
                    {product.brands.join(" - ")}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
                Personalizacion Premium
              </p>

              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-6">
                {product.title}
              </h1>

              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="mb-8">
                <p className="font-display text-foreground mb-4">Caracteristicas:</p>
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
              {Object.entries(productData)
                .filter(([key]) => key !== categoria)
                .map(([key, prod]) => (
                  <Link key={key} href={`/producto/${key}`}>
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
