import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Devoluciones</h1>

        <div className="prose prose-neutral max-w-none prose-p:my-5 leading-relaxed">
          <p>
            Esta página recoge la política de devoluciones aplicada a productos personalizados en la web actual.
            El contenido legal definitivo puede ampliarse con más detalle según validación comercial y jurídica.
          </p>

          <h2>Plazo</h2>
          <p>
            El plazo aplicable para comunicar una incidencia o solicitud de devolución depende del tipo de pedido
            y del estado de personalización del producto.
          </p>

          <h2>Condiciones</h2>
          <p>
            Para tramitar una devolución, es necesario aportar la referencia del pedido y una descripción clara de
            la incidencia, incluyendo material gráfico cuando corresponda.
          </p>

          <h2>Excepciones</h2>
          <p>
            Los productos personalizados pueden estar sujetos a condiciones específicas por su naturaleza,
            por lo que no todos los casos admiten devolución en los mismos términos.
          </p>

          <h2>Contacto</h2>
          <p>
            Para gestionar cualquier solicitud relacionada con devoluciones, utiliza el formulario de contacto
            o llámanos al <a href="tel:+34693039422">693 039 422</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}