import { motion } from "framer-motion";
import { Wine, UtensilsCrossed, CookingPot, Scissors, Shirt, ArrowUpRight } from "lucide-react";

const categories = [
  {
    id: "servilletas",
    title: "Servilletas Personalizadas",
    description: "Servilletas de papel y tela con su logo para crear una imagen de marca coherente.",
    icon: Scissors,
    image: "https://cdn.palbincdn.com/users/36776/upload/images/servilletas-personalizadas.png",
  },
  {
    id: "cristaleria",
    title: "Cristalería Personalizada",
    description: "Copas, vasos y jarras grabados con su marca. Colaboramos con Arcoroc, Bormioli, Stoelzle.",
    icon: Wine,
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-personalizadas.png",
  },
  {
    id: "vajilla",
    title: "Vajilla Personalizada",
    description: "Platos, tazas y platillos con su identidad corporativa. Porcelana de primera calidad.",
    icon: CookingPot,
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-vasos-jarras-todo-personalizado.png",
  },
  {
    id: "cuberteria",
    title: "Cubertería Personalizada",
    description: "Cubiertos de acero inoxidable grabados con láser. Modelos exclusivos 18/10.",
    icon: UtensilsCrossed,
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-4.png",
  },
  {
    id: "textil",
    title: "Contract Textil Hoteles",
    description: "Soluciones textiles completas para hoteles: sábanas, toallas, mantelerías personalizadas.",
    icon: Shirt,
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
    <section className="py-24 bg-gradient-dark" id="productos">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
            Nuestros Productos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Todo para su <span className="text-gradient-gold">Establecimiento</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Solución integral para la reposición constante y las grandes aperturas de hostelería
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
              className={`group relative overflow-hidden rounded-xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 ${
                index === 0 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <ArrowUpRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
