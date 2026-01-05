import { motion } from "framer-motion";
import { ArrowRight, Phone, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden" id="contacto">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
            ¿Listo para empezar?
          </span>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
            Solicite su{" "}
            <span className="text-gradient-gold">Presupuesto Personalizado</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Contacte con nosotros para cualquier duda. Si no le atendemos en el momento, 
            lo haremos antes de lo que supone. Asesoramiento sin compromiso.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl">
              Pedir Presupuesto
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="goldOutline" size="xl">
              <Phone className="w-5 h-5" />
              Llamar Ahora
            </Button>
          </div>

          {/* WhatsApp float hint */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
            <span>También disponible por WhatsApp</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
