import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Check } from "lucide-react";

const productData: Record<string, {
  title: string;
  description: string;
  image: string;
  features: string[];
  brands?: string[];
}> = {
  servilletas: {
    title: "Servilletas Personalizadas",
    description: "Servilletas de papel y tela con su logo para crear una imagen de marca coherente en su establecimiento. Disponibles en múltiples tamaños, colores y calidades.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/servilletas-personalizadas.png",
    features: [
      "Impresión a todo color con tintas ecológicas",
      "Múltiples tamaños: cocktail, almuerzo, cena",
      "Papel reciclado y certificado FSC disponible",
      "Mínimos desde 1.000 unidades",
      "Entrega en 10-15 días laborables",
    ],
  },
  cristaleria: {
    title: "Cristalería Personalizada",
    description: "Copas, vasos y jarras grabados con su marca. Trabajamos con los mejores fabricantes europeos para garantizar la máxima calidad y durabilidad.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-personalizadas.png",
    features: [
      "Grabado láser de alta precisión",
      "Serigrafía a fuego permanente",
      "Cristal templado resistente a lavavajillas industrial",
      "Diseños exclusivos para su marca",
      "Asesoramiento en normativa hostelería",
    ],
    brands: ["Arcoroc", "Bormioli", "Stoelzle"],
  },
  vajilla: {
    title: "Vajilla Personalizada",
    description: "Platos, tazas y platillos con su identidad corporativa. Porcelana de primera calidad europea con personalización duradera.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/copas-vasos-jarras-todo-personalizado.png",
    features: [
      "Porcelana reforzada para uso intensivo",
      "Personalización con calcomanía vitrificable",
      "Resistente a microondas y lavavajillas",
      "Amplia gama de formas y tamaños",
      "Reposición garantizada durante años",
    ],
  },
  cuberteria: {
    title: "Cubertería Personalizada",
    description: "Cubiertos de acero inoxidable grabados con láser. Modelos exclusivos 18/10 con acabados premium para establecimientos de alta categoría.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-4.png",
    features: [
      "Acero inoxidable 18/10 de alta calidad",
      "Grabado láser permanente",
      "Múltiples diseños y acabados",
      "Resistente a uso intensivo",
      "Packaging personalizado opcional",
    ],
  },
  textil: {
    title: "Contract Textil Hoteles",
    description: "Soluciones textiles completas para hoteles: sábanas, toallas, mantelerías personalizadas con bordado o estampación de alta calidad.",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/soluciones-textiles-para-hoteles-3.png",
    features: [
      "Algodón 100% de primera calidad",
      "Bordado computerizado de alta definición",
      "Estampación textil duradera",
      "Programa de reposición continua",
      "Cumplimiento normativa hotelera",
    ],
  },
};

const ProductoPage = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const product = categoria ? productData[categoria] : null;

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Producto no encontrado</h1>
          <Link to="/" className="text-primary hover:underline">
            Volver al inicio
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <Link 
            to="/#productos" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a productos
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square overflow-hidden border border-border bg-card">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.brands && (
                <div className="mt-4 p-4 bg-muted border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Colaboramos con:</p>
                  <p className="font-display font-semibold text-primary">
                    {product.brands.join(" • ")}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-primary bg-primary/10 border border-primary/30 uppercase tracking-wider">
                Personalización Premium
              </span>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
                {product.title}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="mb-8">
                <h3 className="text-lg font-display font-semibold mb-4">Características:</h3>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="gold" size="xl" className="flex-1">
                  <Link to={`/presupuesto?categoria=${categoria}`}>
                    <FileText className="w-5 h-5 mr-2" />
                    Pedir Presupuesto
                  </Link>
                </Button>
                <Button asChild variant="goldOutline" size="xl" className="flex-1">
                  <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer">
                    Contactar por WhatsApp
                  </a>
                </Button>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                * Solicite presupuesto sin compromiso. Respuesta en menos de 24h laborables.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-display font-bold mb-8 text-center">
            Otros Productos que Pueden Interesarle
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(productData)
              .filter(([key]) => key !== categoria)
              .map(([key, prod]) => (
                <Link
                  key={key}
                  to={`/producto/${key}`}
                  className="group bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-sm group-hover:text-primary transition-colors">
                      {prod.title}
                    </h3>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default ProductoPage;
