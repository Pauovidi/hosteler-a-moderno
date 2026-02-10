"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const brands = [
  { name: "Arcoroc", logo: "https://cdn.palbincdn.com/users/36776/upload/images/arcoroc.jpg" },
  { name: "Bormioli", logo: "https://cdn.palbincdn.com/users/36776/upload/images/bormioli-8.jpg" },
  { name: "Stoelzle", logo: "https://cdn.palbincdn.com/users/36776/upload/images/stolzie.jpg" },
  { name: "Chef & Sommelier", logo: "https://cdn.palbincdn.com/users/36776/upload/images/c-and-s.jpg" },
  { name: "Vicrila", logo: "https://cdn.palbincdn.com/users/36776/upload/images/vicrila.jpg" },
  { name: "Pasabahce", logo: "https://cdn.palbincdn.com/users/36776/upload/images/pasabahce.jpg" },
  { name: "Dalper", logo: "https://cdn.palbincdn.com/users/36776/upload/images/dalper.jpg" },
  { name: "Lubiana", logo: "https://cdn.palbincdn.com/users/36776/upload/images/lubiana-3.jpg" },
];

export function Brands() {
  return (
    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
            Trabajamos con las Mejores Marcas
          </h2>
          <p className="text-muted-foreground">
            Colaboradores oficiales de los principales fabricantes europeos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center"
        >
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300"
            >
              <Image
                src={brand.logo || "/placeholder.svg"}
                alt={brand.name}
                width={120}
                height={60}
                className="object-contain max-h-16"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
