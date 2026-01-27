import { motion } from "framer-motion";
import { Clock, Award, Package, Users, Truck, Settings } from "lucide-react";

const benefits = [
  {
    title: "Tiempos Récord",
    description: "Los plazos de entrega más bajos del mercado para que nunca se quede sin stock.",
    icon: Clock,
  },
  {
    title: "Calidad Premium",
    description: "Seleccionamos los mejores productos europeos por calidad y precio. Somos los expertos.",
    icon: Award,
  },
  {
    title: "Mínimos Bajos",
    description: "Los pedidos mínimos más accesibles para adaptarnos a sus necesidades.",
    icon: Package,
  },
  {
    title: "Asesoramiento Experto",
    description: "Especialistas en aperturas, eventos y proyectos de marca para hostelería y agencias.",
    icon: Users,
  },
  {
    title: "Envíos Europeos",
    description: "Distribución a toda Europa con tarifas competitivas.",
    icon: Truck,
  },
  {
    title: "Servicio Integral",
    description: "La única empresa capaz de coordinar todos sus productos personalizados.",
    icon: Settings,
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
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-primary bg-primary/10 border border-primary/30 uppercase tracking-wider">
            Por qué elegirnos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            Su <span className="text-primary">Socio Estratégico</span> en HORECA
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
              className="group p-8 bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card"
            >
              <div className="w-16 h-16 mb-6 flex items-center justify-center bg-primary/10 border border-primary/30">
                <benefit.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
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
