"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// IMPORTANT: Old-site (legacy) category URLs (we keep them for SEO)
const navLinks = [
  { name: "Productos", href: "/c415714-productos-personalizados.html" },
  { name: "Servilletas", href: "/c412083-servilletas-para-hosteleria-personalizadas.html" },
  { name: "Cristalería", href: "/c412080-cristaleria-personalizada-hosteleria.html" },
  { name: "Vajilla", href: "/c412082-vajilla-personalizada.html" },
  { name: "Cubertería", href: "/c453874-cubiertos-personalizados.html" },
  { name: "Textil Hoteles", href: "/c412081-manteleria-textil-personalizada.html" },
  { name: "Contacto", href: "/presupuesto" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar */}
      <div className="bg-foreground text-background py-2 px-4 text-sm hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-sans">Llámanos: +34 XXX XXX XXX</span>
          <span className="font-sans">info@personalizadoshosteleria.com</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-3.jpg" alt="Personalizados Hosteleria" className="h-12 w-auto" />
            <span className="font-display text-lg text-foreground hidden sm:block">
              Personalizados Hosteleria
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  href={link.href}
                  className="font-sans text-foreground/80 hover:text-foreground transition-colors text-lg tracking-wide"
                >
                  {link.name}
                </Link>
              </div>
            ))}
          </div>

          <Link href="/presupuesto" className="hidden lg:block">
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-6">
              Pedir Presupuesto
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-border"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-foreground/80 hover:text-foreground transition-colors text-lg block py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </div>
              ))}
              <Link href="/presupuesto" onClick={() => setIsMenuOpen(false)}>
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider w-full mt-4">
                  Pedir Presupuesto
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
