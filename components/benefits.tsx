"use client";

import { motion } from "framer-motion";
import { Clock, Award, Package, Users, Truck, Settings } from "lucide-react";

const benefits = [
  {
    title: "Tiempos Record",
    description: "Los plazos de entrega mas bajos del mercado para que nunca se quede sin stock.",
    icon: Clock,
  },
  {
    title: "Calidad Premium",
    description: "Seleccionamos los mejores productos europeos por calidad y precio. Somos los expertos.",
    icon: Award,
  },
  {
    title: "Minimos Bajos",
    description: "Los pedidos minimos mas accesibles para adaptarnos a sus necesidades.",
    icon: Package,
  },
  {
    title: "Asesoramiento Experto",
    description: "Especialistas en aperturas, eventos y proyectos de marca para hosteleria y agencias.",
    icon: Users,
  },
  {
    title: "Envios Europeos",
    description: "Distribucion a toda Europa con tarifas competitivas.",
    icon: Truck,
  },
  {
    title: "Servicio Integral",
    description: "La unica empresa capaz de coordinar todos sus productos personalizados.",
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

export function Benefits() {
  return (
    <section className="py-24 bg-gradient-dark">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
            Por que elegirnos
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
            Su Socio Estrategico en HORECA
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Mas de dos decadas de experiencia nos avalan como lideres en personalizacion hostelera
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
              className="bg-card p-8 border border-border hover:border-gold/30 transition-colors group"
            >
              <div className="w-14 h-14 bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                <benefit.icon className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
