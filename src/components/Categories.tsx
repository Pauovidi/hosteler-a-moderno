import { motion } from "framer-motion";

const categories = [
  {
    id: "servilletas",
    title: "Servilletas Personalizadas",
    description: "Servilletas de papel y tela con su logo para crear una imagen de marca coherente.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/servilletas-personalizadas.png",
  },
  {
    id: "cristaleria",
    title: "Cristalería Personalizada",
    description: "Copas, vasos y jarras grabados con su marca. Colaboramos con Arcoroc, Bormioli, Stoelzle.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-personalizadas.png",
  },
  {
    id: "vajilla",
    title: "Vajilla Personalizada",
    description: "Platos, tazas y platillos con su identidad corporativa. Porcelana de primera calidad.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-vasos-jarras-todo-personalizado.png",
  },
  {
    id: "cuberteria",
    title: "Cubertería Personalizada",
    description: "Cubiertos de acero inoxidable grabados con láser. Modelos exclusivos 18/10.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-4.png",
  },
  {
    id: "textil",
    title: "Contract Textil Hoteles",
    description: "Soluciones textiles completas para hoteles: sábanas, toallas, mantelerías personalizadas.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/soluciones-textiles-para-hoteles-3.png",
  },
];

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

export const Categories = () => {
  return (
    <section className="py-24 bg-background" id="productos">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-primary bg-primary/10 border border-primary/30 uppercase tracking-wider">
            Nuestros Productos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Todo para su <span className="text-primary">Establecimiento</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Solución integral para reposición constante, grandes aperturas y proyectos de branding
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category, index) => (
            <motion.a
              key={category.id}
              href={`#${category.id}`}
              variants={itemVariants}
              className={`group relative overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 ${
                index === 0 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="text-card">
                  <h3 className="text-xl md:text-2xl font-display font-bold mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm opacity-90 line-clamp-2">
                    {category.description}
                  </p>
                  <span className="inline-block mt-4 text-sm uppercase tracking-wider border-b border-current pb-1 group-hover:border-primary group-hover:text-primary transition-colors">
                    Ver productos →
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
