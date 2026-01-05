import { motion } from "framer-motion";
import { Clock, Shield, Package, Headphones, Truck, BadgeCheck } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Tiempos Récord",
    description: "Los plazos de entrega más bajos del mercado para que nunca se quede sin stock.",
  },
  {
    icon: Shield,
    title: "Calidad Garantizada",
    description: "Trabajamos solo con las mejores marcas europeas: Arcoroc, Bormioli, Stoelzle.",
  },
  {
    icon: Package,
    title: "Mínimos Bajos",
    description: "Los pedidos mínimos más accesibles para adaptarnos a sus necesidades.",
  },
  {
    icon: Headphones,
    title: "Asesoramiento Experto",
    description: "Equipo especializado en hostelería para guiarle en cada proyecto.",
  },
  {
    icon: Truck,
    title: "Envíos Europeos",
    description: "Distribución a toda Europa con tarifas competitivas.",
  },
  {
    icon: BadgeCheck,
    title: "Servicio Integral",
    description: "La única empresa capaz de coordinar todos sus productos personalizados.",
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const Benefits = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
            Por qué elegirnos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Su <span className="text-gradient-gold">Socio Estratégico</span> en HORECA
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Más de dos décadas de experiencia nos avalan como líderes en personalización hostelera
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={itemVariants}
              className="group p-8 rounded-xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
