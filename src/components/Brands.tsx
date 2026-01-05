import { motion } from "framer-motion";

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

export const Brands = () => {
  return (
    <section className="py-20 bg-background border-y border-border">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
            Trabajamos con las <span className="text-primary">Mejores Marcas</span>
          </h2>
          <p className="text-muted-foreground">
            Colaboradores oficiales de los principales fabricantes europeos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 items-center"
        >
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex items-center justify-center p-4 bg-secondary/50 border border-border hover:border-primary/30 transition-all duration-300 grayscale hover:grayscale-0"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-12 w-auto object-contain"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
