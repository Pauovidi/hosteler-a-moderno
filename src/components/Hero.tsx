import { motion } from "framer-motion";
import { ArrowRight, Truck, Award, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import heroImage from "@/assets/hero-tableware.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Cristalería y vajilla personalizada para hostelería"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 border border-primary/30"
          >
            Branding y Soluciones Integrales para Hostelería y Agencias
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-6"
          >
            Productos{" "}
            <span className="text-primary">Personalizados</span>{" "}
            con Tiempos de Entrega Récord
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl"
          >
            Expertos en aperturas, eventos y estrategias de marca. 
            Cristalería, vajilla, cubertería y textil con los mejores 
            productos europeos y tiempos de entrega récord.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-12"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/presupuesto">
                Solicitar Presupuesto
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="goldOutline" size="xl">
              Ver Catálogo
            </Button>
          </motion.div>

          {/* Trust indicators - with images instead of icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div className="flex items-center gap-4 border-l-2 border-primary pl-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 border border-primary/30">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Entrega Rápida</p>
                <p className="text-sm text-muted-foreground">Plazos récord del mercado</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l-2 border-primary pl-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 border border-primary/30">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Calidad Premium</p>
                <p className="text-sm text-muted-foreground">Mejores productos europeos</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l-2 border-primary pl-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 border border-primary/30">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Envíos Europa</p>
                <p className="text-sm text-muted-foreground">Servicio integral</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
