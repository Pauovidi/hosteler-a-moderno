"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const categories = [
  {
    id: "servilletas-personalizadas",
    title: "Servilletas Personalizadas",
    description: "Servilletas de papel y tela con su logo para crear una imagen de marca coherente.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/servilletas-personalizadas.png",
    href: "/servilletas-personalizadas",
  },
  {
    id: "cristaleria-personalizada",
    title: "Cristalería Personalizada",
    description: "Copas, vasos y jarras grabados con su marca. Colaboramos con Arcoroc, Bormioli, Stoelzle.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-personalizadas.png",
    href: "/cristaleria-personalizada",
  },
  {
    id: "vajilla-personalizada",
    title: "Vajilla Personalizada",
    description: "Platos, tazas y platillos con su identidad corporativa. Porcelana de primera calidad.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-vasos-jarras-todo-personalizado.png",
    href: "/vajilla-personalizada",
  },
  {
    id: "cuberteria-personalizada",
    title: "Cubertería Personalizada",
    description: "Cubiertos de acero inoxidable grabados con láser. Modelos exclusivos 18/10.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-4.png",
    href: "/cuberteria-personalizada",
  },
  {
    id: "textil",
    title: "Contract Textil Hoteles",
    description: "Soluciones textiles completas para hoteles: sábanas, toallas, mantelerías personalizadas.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/soluciones-textiles-para-hoteles-3.png",
    href: "/c412081-manteleria-textil-personalizada.html",
  },
];

type CategoryCard = (typeof categories)[number];

type MenuItem = {
  label: string;
  href: string;
};

const categoryCardBySlug = new Map(categories.map((category) => [category.id, category]));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Categories() {
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>(categories);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const response = await fetch("/api/headless/menu", {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { items?: MenuItem[] };
        if (!Array.isArray(payload.items) || payload.items.length === 0) {
          return;
        }

        const dynamicCards = payload.items
          .map((item) => {
            const slug = item.href.replace(/^\/+|\/+$/g, "");
            const fallbackCard = categoryCardBySlug.get(slug);
            if (!fallbackCard) {
              return null;
            }

            return {
              ...fallbackCard,
              title: item.label,
              href: item.href,
            };
          })
          .filter((item): item is CategoryCard => Boolean(item));

        if (dynamicCards.length > 0) {
          setCategoryCards((previous) => {
            const hasTextil = previous.find((category) => category.id === "textil");
            return hasTextil ? [...dynamicCards, hasTextil] : dynamicCards;
          });
        }
      } catch {
        // Keep the static fallback cards during migration.
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  return (
    <section id="productos" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
            Nuestros Productos
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
            Todo para su Establecimiento
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Branding y Soluciones Integrales para Hostelería y Agencias Expertos en aperturas, eventos y estrategias de marca.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {categoryCards.map((category, index) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className={index === categoryCards.length - 1 ? "md:col-span-2 lg:col-span-1" : ""}
            >
              <Link href={category.href}>
                <div className="group bg-card border border-border overflow-hidden hover:border-gold/30 transition-all duration-300">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl text-foreground mb-2 group-hover:text-gold transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    <span className="text-gold font-display text-sm tracking-wider inline-flex items-center">
                      Ver catálogo →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
