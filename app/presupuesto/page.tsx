"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send, CheckCircle } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const categorias = [
  "Servilletas",
  "Cristalería",
  "Vajilla",
  "Cubertería",
  "Textil Hoteles",
  "Otros",
];

// ✅ Page wrapper con Suspense (evita el prerender error)
export default function PresupuestoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 pt-32 pb-20"><div className="container mx-auto px-4">Cargando…</div></main><Footer /></div>}>
      <PresupuestoInner />
    </Suspense>
  );
}

// ✅ Aquí va tu lógica actual (useSearchParams dentro del boundary)
function PresupuestoInner() {
  const searchParams = useSearchParams();

  const fromProduct = useMemo(() => {
    const producto = searchParams.get("producto") || "";
    const mensaje = searchParams.get("mensaje") || "";
    return { producto, mensaje };
  }, [searchParams]);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    categorias: [] as string[],
    mensaje: "",
  });

  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    // Prefill message when coming from a product page
    if (fromProduct.mensaje) {
      setFormData((prev) => ({ ...prev, mensaje: fromProduct.mensaje }));
    }
  }, [fromProduct.mensaje]);

  const handleCategoriaToggle = (categoria: string) => {
    setFormData((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(categoria)
        ? prev.categorias.filter((c) => c !== categoria)
        : [...prev.categorias, categoria],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí en el futuro se conectará con email/CRM. Para demo, simulamos.
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-32 pb-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="font-display text-3xl text-foreground mb-4">¡Solicitud Enviada!</h1>
              <p className="text-muted-foreground text-lg mb-8">
                Hemos recibido tu solicitud de presupuesto. Te contactaremos en menos de 24 horas laborables.
              </p>
              <Button
                onClick={() => {
                  setEnviado(false);
                  setFormData({
                    nombre: "",
                    email: "",
                    telefono: "",
                    empresa: "",
                    categorias: [],
                    mensaje: "",
                  });
                }}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider"
              >
                Enviar Otra Solicitud
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
                <FileText className="w-4 h-4" />
                Solicitud de Presupuesto
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-6">Pedir Presupuesto</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Cuéntanos qué necesitas y te prepararemos un presupuesto personalizado sin compromiso.
              </p>

              {fromProduct.producto ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Presupuesto para: <span className="text-foreground font-medium">{fromProduct.producto}</span>
                </p>
              ) : null}
            </div>

            <Card className="border-border">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nombre" className="font-display">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="font-display">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="telefono" className="font-display">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="empresa" className="font-display">Empresa</Label>
                      <Input
                        id="empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData((prev) => ({ ...prev, empresa: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-display">Categorías de interés</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {categorias.map((categoria) => (
                        <label
                          key={categoria}
                          className={
                            "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors " +
                            (formData.categorias.includes(categoria)
                              ? "border-gold bg-gold/5"
                              : "border-border hover:border-gold/30")
                          }
                        >
                          <input
                            type="checkbox"
                            checked={formData.categorias.includes(categoria)}
                            onChange={() => handleCategoriaToggle(categoria)}
                            className="rounded"
                          />
                          <span className="text-sm">{categoria}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mensaje" className="font-display">Mensaje *</Label>
                    <Textarea
                      id="mensaje"
                      value={formData.mensaje}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mensaje: e.target.value }))}
                      required
                      rows={6}
                      className="mt-2"
                      placeholder="Describe tu proyecto, cantidades aproximadas, plazos, etc."
                    />
                  </div>

                  <div className="text-center">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-12"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      Enviar Solicitud
                    </Button>
                    <p className="text-muted-foreground text-sm mt-4">
                      Te responderemos en menos de 24 horas laborables.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
