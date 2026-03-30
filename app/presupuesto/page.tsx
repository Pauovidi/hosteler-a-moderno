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
import {
  QUOTE_ATTACHMENT_FIELD_NAME,
  QUOTE_CATEGORIES,
  QUOTE_FILE_ACCEPT,
  QUOTE_MAX_FILE_SIZE_BYTES,
} from "@/lib/quote/shared";

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
    categoria: "",
    mensaje: "",
  });

  const [enviado, setEnviado] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    // Prefill message when coming from a product page
    if (fromProduct.mensaje) {
      setFormData((prev) => ({ ...prev, mensaje: fromProduct.mensaje }));
    }
  }, [fromProduct.mensaje]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      setSelectedFile(null);
      setFileError("");
      return;
    }

    if (file.size > QUOTE_MAX_FILE_SIZE_BYTES) {
      event.target.value = "";
      setSelectedFileName("");
      setSelectedFile(null);
      setFileError("El archivo supera el máximo de 5 MB.");
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFile(file);
    setFileError("");
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      empresa: "",
      categoria: "",
      mensaje: "",
    });
    setSelectedFileName("");
    setSelectedFile(null);
    setFileError("");
    setSubmitError("");
    setSuccessMessage("");
    setFileInputKey((current) => current + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fileError || !formData.categoria) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = new FormData();
      payload.set("nombre", formData.nombre);
      payload.set("email", formData.email);
      payload.set("telefono", formData.telefono);
      payload.set("empresa", formData.empresa);
      payload.set("categoria", formData.categoria);
      payload.set("mensaje", formData.mensaje);

      if (selectedFile) {
        payload.set(QUOTE_ATTACHMENT_FIELD_NAME, selectedFile);
      }

      const response = await fetch("/api/quote-request", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string } | null;

      if (!response.ok || !result?.ok) {
        setSubmitError(result?.error || "No se pudo enviar la solicitud. Inténtalo de nuevo.");
        return;
      }

      setSuccessMessage(result.message || "Tu solicitud se ha enviado correctamente.");
      setEnviado(true);
    } catch {
      setSubmitError("No se pudo enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
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
                {successMessage || "Hemos recibido tu solicitud de presupuesto. Te contactaremos en menos de 24 horas laborables."}
              </p>
              <Button
                onClick={() => {
                  setEnviado(false);
                  resetForm();
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
                    <Label className="font-display">Categoría de interés *</Label>
                    <div className="grid grid-cols-1 gap-3 mt-3 md:grid-cols-2">
                      {QUOTE_CATEGORIES.map((categoria) => (
                        <label
                          key={categoria}
                          className={
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors " +
                            (formData.categoria === categoria
                              ? "border-gold bg-gold/5"
                              : "border-border hover:border-gold/30")
                          }
                        >
                          <input
                            type="radio"
                            name="categoria"
                            value={categoria}
                            checked={formData.categoria === categoria}
                            onChange={(e) => setFormData((prev) => ({ ...prev, categoria: e.target.value }))}
                            required
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{categoria}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="archivo" className="font-display">Logotipo o imagen</Label>
                    <Input
                      key={fileInputKey}
                      id="archivo"
                      type="file"
                      accept={QUOTE_FILE_ACCEPT}
                      onChange={handleFileChange}
                      className="mt-2"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Puedes adjuntar un logotipo o imagen en PNG, JPG, WEBP o SVG de hasta 5 MB.
                    </p>
                    {selectedFileName ? (
                      <p className="mt-2 text-sm text-foreground">Archivo seleccionado: {selectedFileName}</p>
                    ) : null}
                    {fileError ? (
                      <p className="mt-2 text-sm text-destructive">{fileError}</p>
                    ) : null}
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
                      disabled={isSubmitting}
                      className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-12"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                    </Button>
                    {submitError ? (
                      <p className="text-destructive text-sm mt-4">{submitError}</p>
                    ) : null}
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
