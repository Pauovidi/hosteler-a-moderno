import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-secondary/50" id="contacto">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 border border-primary/30 uppercase tracking-wider">
            ¿Listo para empezar?
          </span>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
            Solicite su{" "}
            <span className="text-primary">Presupuesto Personalizado</span>
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
              Llamar Ahora
            </Button>
          </div>

          {/* Contact image */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <img 
              src="https://cdn.palbincdn.com/users/36776/upload/images/whatsapp-contact.png" 
              alt="WhatsApp" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-muted-foreground">También disponible por WhatsApp</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Background decoration - classic lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20" />
    </section>
  );
};
