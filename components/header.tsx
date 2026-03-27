"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type MenuItem = {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
};

const MENU_CATEGORIES: MenuItem[] = [
  {
    label: "Cristalería Personalizada",
    href: "/cristaleria-personalizada/",
    children: [
      { label: "Copas de Vino Personalizadas", href: "/copas-de-vino-personalizadas/" },
      { label: "Cristalería Cerveza Personalizada", href: "/cristaleria-cerveza-personalizada/" },
      { label: "Vasos Combinados Botellas Cava", href: "/vasos-combinados-botellas-cava/" },
    ],
  },
  {
    label: "Vajilla Personalizada",
    href: "/vajilla-personalizada/",
    children: [
      { label: "Tazas y Platillos Personalizados", href: "/tazas-y-platillos-personalizados/" },
      { label: "Platos Personalizados", href: "/platos-personalizados/" },
      { label: "Fuentes Ensaladeras Personalizadas", href: "/fuentes-ensaladeras-personalizadas/" },
      { label: "Platos de Pizza Personalizados", href: "/platos-de-pizza-personalizados/" },
      { label: "Manteles Caminos Personalizados", href: "/manteles-caminos-personalizados/" },
    ],
  },
  {
    label: "Servilletas Personalizadas",
    href: "/servilletas-personalizadas/",
    children: [
      { label: "Servilletas Bar Cocktail Personalizadas", href: "/servilletas-bar-cocktail-personalizadas/" },
      { label: "Servilletas de Mesa Personalizadas", href: "/servilletas-de-mesa-personalizadas/" },
    ],
  },
  {
    label: "Cubertería Personalizada",
    href: "/cuberteria-personalizada/",
  },
];

const EXTRA_LINKS = [
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/presupuesto" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const [openMobileMenus, setOpenMobileMenus] = useState<Record<string, boolean>>({});
  const [menuCategories, setMenuCategories] = useState<MenuItem[]>(MENU_CATEGORIES);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      try {
        const response = await fetch("/api/headless/menu", {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { items?: MenuItem[] };
        if (Array.isArray(payload.items) && payload.items.length > 0) {
          setMenuCategories(payload.items);
        }
      } catch {
        // Keep the baked-in menu fallback if the headless endpoint is not ready yet.
      }
    }

    void loadMenu();

    return () => controller.abort();
  }, []);

  const toggleMobileMenu = (label: string) => {
    setOpenMobileMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-foreground text-background py-2 px-4 text-sm hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <a href="tel:+34693039422" className="font-sans hover:underline">
            Llámanos: 693 039 422
          </a>
          <span className="font-sans">info@personalizadoshosteleria.com</span>
        </div>
      </div>

      <nav className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Personalizados Hosteleria">
            <img src="/logo-3.jpg" alt="Personalizados Hosteleria" className="h-12 w-auto" />
            <span className="sr-only">Personalizados Hosteleria</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {menuCategories.map((item) => {
              if (!item.children?.length) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="font-sans text-foreground/80 hover:text-foreground transition-colors text-sm font-semibold tracking-wide"
                  >
                    {item.label}
                  </Link>
                );
              }

              const isOpen = openDesktopMenu === item.label;

              return (
                <div
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() => setOpenDesktopMenu(item.label)}
                  onMouseLeave={() => setOpenDesktopMenu((prev) => (prev === item.label ? null : prev))}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setOpenDesktopMenu(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-sans text-foreground/80 hover:text-foreground transition-colors text-sm font-semibold tracking-wide"
                    onClick={() => setOpenDesktopMenu((prev) => (prev === item.label ? null : item.label))}
                    onFocus={() => setOpenDesktopMenu(item.label)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpenDesktopMenu((prev) => (prev === item.label ? null : item.label));
                      }
                      if (event.key === "Escape") {
                        setOpenDesktopMenu(null);
                      }
                    }}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  <div
                    className={`absolute left-0 top-full z-[80] pt-2 min-w-[320px] ${isOpen ? "block" : "hidden"} group-hover:block group-focus-within:block`}
                    role="menu"
                  >
                    <div className="rounded-md border border-border bg-white shadow-lg p-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block rounded px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
                          role="menuitem"
                          onClick={() => setOpenDesktopMenu(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {EXTRA_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-sans text-foreground/80 hover:text-foreground transition-colors text-sm font-semibold tracking-wide"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link href="/presupuesto" className="hidden lg:block">
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-display tracking-wider px-6">
              Pedir Presupuesto
            </Button>
          </Link>

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

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-border"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {menuCategories.map((item) => (
                <div key={item.label} className="border-b border-border/60 pb-3">
                  {item.children?.length ? (
                    <>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-2 font-sans text-foreground/80 hover:text-foreground transition-colors text-base font-semibold py-2"
                        aria-label={`Desplegar ${item.label}`}
                        aria-expanded={!!openMobileMenus[item.label]}
                        onClick={() => toggleMobileMenu(item.label)}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openMobileMenus[item.label] ? "rotate-180" : ""}`} />
                      </button>

                      {openMobileMenus[item.label] ? (
                        <div className="ml-3 mt-1 flex flex-col gap-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="text-sm text-foreground/70 hover:text-foreground py-1"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="font-sans text-foreground/80 hover:text-foreground transition-colors text-base font-semibold block py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {EXTRA_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-sans text-foreground/80 hover:text-foreground transition-colors text-base font-semibold block py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
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
