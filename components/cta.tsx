"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="contacto" className="py-24 bg-gradient-dark relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
            Listo para empezar?
          </p>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
            Solicite su{" "}
            <span className="text-gradient-gold">Presupuesto Personalizado</span>
          </h2>

          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Contacte con nosotros para cualquier duda. Si no le atendemos en el momento, 
            lo haremos antes de lo que supone. Asesoramiento sin compromiso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/presupuesto">
              <Button
                size="lg"
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-8"
              >
                Pedir Presupuesto
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:+34XXXXXXXXX">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gold text-foreground hover:bg-gold/10 font-display tracking-wider px-8 bg-transparent"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Llamar Ahora
              </Button>
            </a>
          </div>

          {/* Contact hint */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 text-muted-foreground text-sm"
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
            <span>Tambien disponible por WhatsApp</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Background decoration - classic lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </section>
  );
}
