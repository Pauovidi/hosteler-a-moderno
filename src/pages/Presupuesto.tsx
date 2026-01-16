import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const categories = [
  {
    id: "vajilla",
    title: "Vajilla Personalizada",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/vajilla-para-opresupuesto.png",
  },
  {
    id: "cristaleria",
    title: "Cristalería Personalizada",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cristaleria-generica.png",
  },
  {
    id: "servilletas",
    title: "Servilletas Personalizadas",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/categoria-arilaid@x256--f[gb]--o[jpeg].png",
  },
  {
    id: "cuberteria",
    title: "Cubertería Personalizada",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-5@x256--f[gb]--o[jpeg].png",
  },
  {
    id: "textil",
    title: "Textil para Hoteles",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/soluciones-textiles-para-hoteles-3.png",
  },
];

const formSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  empresa: z.string().trim().max(100, "Máximo 100 caracteres").optional(),
  email: z.string().trim().email("Email no válido").max(255, "Máximo 255 caracteres"),
  telefono: z.string().trim().min(1, "El teléfono es obligatorio").max(20, "Máximo 20 caracteres"),
  categorias: z.array(z.string()).min(1, "Selecciona al menos una categoría"),
  mensaje: z.string().trim().min(1, "El mensaje es obligatorio").max(2000, "Máximo 2000 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

const Presupuesto = () => {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    if (errors.categorias) {
      setErrors((prev) => ({ ...prev, categorias: undefined }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate = {
      ...formData,
      categorias: selectedCategories,
    };

    const result = formSchema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    toast({
      title: "¡Solicitud enviada!",
      description: "Nos pondremos en contacto contigo lo antes posible.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-primary/10 border border-primary/30">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                ¡Gracias por tu solicitud!
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Hemos recibido tu petición de presupuesto. Nuestro equipo revisará 
                los detalles y te contactará en las próximas 24-48 horas.
              </p>
              <Button variant="gold" size="lg" asChild>
                <a href="/">Volver al Inicio</a>
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-primary bg-primary/10 border border-primary/30 uppercase tracking-wider">
              Solicitar Presupuesto
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Cuéntanos tu <span className="text-primary">Proyecto</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rellena el formulario con la información de tu proyecto. 
              No olvides enviarnos tu logo o diseño de personalización.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Category Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-display font-bold mb-6">
                  1. Selecciona las categorías de producto
                </h2>
                {errors.categorias && (
                  <p className="text-destructive text-sm mb-4">{errors.categorias}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`group relative overflow-hidden border-2 transition-all duration-300 ${
                        selectedCategories.includes(category.id)
                          ? "border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="aspect-[4/3] relative">
                        <img
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 transition-colors duration-300 ${
                          selectedCategories.includes(category.id)
                            ? "bg-primary/20"
                            : "bg-foreground/40 group-hover:bg-foreground/30"
                        }`} />
                        {selectedCategories.includes(category.id) && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-primary flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-card">
                        <p className="font-semibold text-foreground text-sm">
                          {category.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-display font-bold mb-6">
                  2. Datos de contacto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      placeholder="Tu nombre"
                      className={errors.nombre ? "border-destructive" : ""}
                    />
                    {errors.nombre && (
                      <p className="text-destructive text-sm">{errors.nombre}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                      placeholder="Nombre de tu empresa (opcional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="tu@email.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="+34 XXX XXX XXX"
                      className={errors.telefono ? "border-destructive" : ""}
                    />
                    {errors.telefono && (
                      <p className="text-destructive text-sm">{errors.telefono}</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Project Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-display font-bold mb-6">
                  3. Detalles del proyecto
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mensaje">
                      Describe tu proyecto: cantidades, colores, personalización... *
                    </Label>
                    <Textarea
                      id="mensaje"
                      value={formData.mensaje}
                      onChange={(e) => handleInputChange("mensaje", e.target.value)}
                      placeholder="Cuéntanos todos los detalles de tu proyecto: qué productos necesitas, cantidades aproximadas, tipo de personalización (grabado, serigrafía, etc.), colores preferidos..."
                      rows={6}
                      className={errors.mensaje ? "border-destructive" : ""}
                    />
                    {errors.mensaje && (
                      <p className="text-destructive text-sm">{errors.mensaje}</p>
                    )}
                  </div>

                  {/* File upload hint */}
                  <div className="p-6 border-2 border-dashed border-border bg-secondary/30">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/10 border border-primary/30 shrink-0">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">
                          ¿Tienes un logo o diseño?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Envíanos tu logo o diseño de personalización a{" "}
                          <a 
                            href="mailto:info@personalizadoshosteleria.com" 
                            className="text-primary hover:underline"
                          >
                            info@personalizadoshosteleria.com
                          </a>{" "}
                          indicando tu nombre y empresa para que podamos asociarlo a tu solicitud.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-4 pt-6 border-t border-border"
              >
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="xl"
                  disabled={isSubmitting}
                  className="min-w-[250px]"
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Enviar Solicitud
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Al enviar este formulario, aceptas que nos pongamos en contacto contigo 
                  para ofrecerte un presupuesto personalizado.
                </p>
              </motion.div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Presupuesto;
