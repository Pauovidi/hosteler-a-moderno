"use client";

import { motion } from "framer-motion";
import { ArrowRight, Truck, Award, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://raw.githubusercontent.com/Pauovidi/hosteler-a-moderno/main/src/assets/hero-tableware.jpg"
          alt="Productos de hosteleria personalizados"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/97 via-background/90 to-background/70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-6"
          >
            Branding y Soluciones Integrales para Hosteleria y Agencias
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6"
          >
            Productos{" "}
            <span className="text-gradient-gold">Personalizados</span>{" "}
            con Tiempos de Entrega Record
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
          >
            Expertos en aperturas, eventos y estrategias de marca. 
            Cristaleria, vajilla, cuberteria y textil con los mejores 
            productos europeos y tiempos de entrega record.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link href="/presupuesto">
              <Button
                size="lg"
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-8 py-6 text-lg"
              >
                Solicitar Presupuesto
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#productos">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gold text-foreground hover:bg-gold/10 font-display tracking-wider px-8 py-6 text-lg bg-transparent"
              >
                Ver Catalogo
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm p-4 border border-border">
              <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="font-display text-sm text-foreground">Entrega Rapida</p>
                <p className="text-sm text-muted-foreground">Plazos record del mercado</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm p-4 border border-border">
              <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="font-display text-sm text-foreground">Calidad Premium</p>
                <p className="text-sm text-muted-foreground">Mejores productos europeos</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm p-4 border border-border">
              <div className="w-12 h-12 bg-gold/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="font-display text-sm text-foreground">Envios Europa</p>
                <p className="text-sm text-muted-foreground">Servicio integral</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  );
}
