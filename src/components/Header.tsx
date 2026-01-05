import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const navLinks = [
  { name: "Servilletas", href: "#servilletas" },
  { name: "Cristalería", href: "#cristaleria" },
  { name: "Vajilla", href: "#vajilla" },
  { name: "Cubertería", href: "#cuberteria" },
  { name: "Textil Hoteles", href: "#textil" },
  { name: "Contacto", href: "#contacto" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Top bar */}
      <div className="hidden md:flex items-center justify-end gap-8 px-6 py-2 bg-secondary text-sm border-b border-border">
        <a href="tel:+34XXX" className="text-muted-foreground hover:text-primary transition-colors">
          Llámanos: +34 XXX XXX XXX
        </a>
        <a href="mailto:info@personalizadoshosteleria.com" className="text-muted-foreground hover:text-primary transition-colors">
          info@personalizadoshosteleria.com
        </a>
      </div>

      {/* Main nav */}
      <nav className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl font-display font-bold text-primary">
              PH
            </span>
            <span className="hidden sm:block text-sm text-muted-foreground leading-tight border-l border-border pl-3">
              Personalizados<br />Hostelería
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-wider"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:block">
            <Button variant="gold" size="lg">
              Pedir Presupuesto
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="lg:hidden bg-background border-t border-border"
          >
            <ul className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="block py-3 text-foreground hover:text-primary transition-colors uppercase tracking-wider text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              <li className="pt-4 border-t border-border">
                <Button variant="gold" className="w-full">
                  Pedir Presupuesto
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
