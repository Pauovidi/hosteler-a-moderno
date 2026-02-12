"use client";

import React from "react"

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import Image from "next/image";

const categories = [
  {
    id: "vajilla",
    title: "Vajilla Personalizada",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/vajilla-para-opresupuesto.png",
  },
  {
    id: "cristaleria",
    title: "Cristaleria Personalizada",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cristaleria-generica.png",
  },
  {
    id: "servilletas",
    title: "Servilletas Personalizadas",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/categoria-arilaid@x256--f[gb]--o[jpeg].png",
  },
  {
    id: "cuberteria",
    title: "Cuberteria Personalizada",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/cuberteria-personalizada-5@x256--f[gb]--o[jpeg].png",
  },
  {
    id: "textil",
    title: "Textil para Hoteles",
    image: "https://cdn.palbincdn.com/users/36776/upload/images/soluciones-textiles-para-hoteles-3.png",
  },
];

interface FormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  mensaje: string;
}

interface FormErrors {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  categorias?: string;
}

export default function Presupuesto() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
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
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email no valido";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El telefono es obligatorio";
    }
    if (selectedCategories.length === 0) {
      newErrors.categorias = "Selecciona al menos una categoria";
    }
    if (!formData.mensaje.trim()) {
      newErrors.mensaje = "El mensaje es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-lg mx-auto px-4"
          >
            <div className="w-20 h-20 bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-display text-3xl text-foreground mb-4">
              Gracias por tu solicitud!
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Hemos recibido tu peticion de presupuesto. Nuestro equipo revisara 
              los detalles y te contactara en las proximas 24-48 horas.
            </p>
            <Link href="/">
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider">
                Volver al Inicio
              </Button>
            </Link>
          </motion.div>
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <p className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
              Solicitar Presupuesto
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-6">
              Cuentanos tu Proyecto
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Rellena el formulario con la informacion de tu proyecto. 
              No olvides enviarnos tu logo o diseno de personalizacion.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {/* Category Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="font-display text-xl text-foreground mb-6">
                1. Selecciona las categorias de producto
              </h2>
              {errors.categorias && (
                <p className="text-destructive text-sm mb-4">{errors.categorias}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    <div className="aspect-square relative">
                      <Image
                        src={category.image || "/placeholder.svg"}
                        alt={category.title}
                        fill
                        className="object-cover"
                      />
                      {selectedCategories.includes(category.id) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-card">
                      <p className="font-display text-xs text-foreground text-center">
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
              className="mb-12"
            >
              <h2 className="font-display text-xl text-foreground mb-6">
                2. Datos de contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Tu nombre"
                    className={errors.nombre ? "border-destructive" : ""}
                  />
                  {errors.nombre && (
                    <p className="text-destructive text-sm mt-1">{errors.nombre}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => handleInputChange("empresa", e.target.value)}
                    placeholder="Nombre de tu empresa (opcional)"
                  />
                </div>
                <div>
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
                    <p className="text-destructive text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telefono">Telefono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    placeholder="+34 XXX XXX XXX"
                    className={errors.telefono ? "border-destructive" : ""}
                  />
                  {errors.telefono && (
                    <p className="text-destructive text-sm mt-1">{errors.telefono}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <h2 className="font-display text-xl text-foreground mb-6">
                3. Detalles del proyecto
              </h2>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="mensaje">
                    Describe tu proyecto: cantidades, colores, personalizacion... *
                  </Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => handleInputChange("mensaje", e.target.value)}
                    placeholder="Cuentanos todos los detalles de tu proyecto: que productos necesitas, cantidades aproximadas, tipo de personalizacion (grabado, serigrafia, etc.), colores preferidos..."
                    rows={6}
                    className={errors.mensaje ? "border-destructive" : ""}
                  />
                  {errors.mensaje && (
                    <p className="text-destructive text-sm mt-1">{errors.mensaje}</p>
                  )}
                </div>

                {/* File upload hint */}
                <div className="bg-muted p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-display text-foreground mb-2">
                        Tienes un logo o diseno?
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Envianos tu logo o diseno de personalizacion a{" "}
                        <a href="mailto:info@personalizadoshosteleria.com" className="text-gold hover:underline">
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
              className="text-center"
            >
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-12"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    Enviar Solicitud
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-muted-foreground text-sm mt-4">
                Al enviar este formulario, aceptas que nos pongamos en contacto contigo 
                para ofrecerte un presupuesto personalizado.
              </p>
            </motion.div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
