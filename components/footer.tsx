"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { CATALOG_MENU_FALLBACK, type CatalogMenuItem } from "@/lib/headless/constants";

const legalLinks = [
  { name: "Aviso Legal", href: "#" },
  { name: "Politica de Privacidad", href: "#" },
  { name: "Politica de Cookies", href: "#" },
  { name: "Devoluciones", href: "/devoluciones", external: false },
];

const FOOTER_LOGO_SRC = "/logo-3.jpg";

export function Footer() {
  const [menuItems, setMenuItems] = useState<CatalogMenuItem[]>(CATALOG_MENU_FALLBACK);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

        const payload = (await response.json()) as { items?: CatalogMenuItem[] };
        if (Array.isArray(payload.items) && payload.items.length > 0) {
          setMenuItems(payload.items);
        }
      } catch {
        // Keep the baked-in fallback when the menu endpoint is unavailable.
      }
    }

    void loadMenu();

    return () => controller.abort();
  }, []);

  const toggleSection = (label: string) => {
    setOpenSections((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  return (
    <>
      <footer className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr]">
            <div className="max-w-sm">
              <Link href="/" className="inline-flex items-center" aria-label="Personalizados Hosteleria">
                <img src={FOOTER_LOGO_SRC} alt="Personalizados Hosteleria" className="h-16 w-auto rounded-sm" />
              </Link>
              <p className="mt-5 text-sm leading-relaxed text-background/70">
                Productos personalizados para hostelería con asesoramiento directo, producción cuidada y entregas a toda Europa.
              </p>
            </div>

            <div>
              <h4 className="mb-5 font-display text-lg text-background">Productos</h4>
              <div className="space-y-3">
                {menuItems.map((item) => {
                  const isOpen = Boolean(openSections[item.label]);

                  if (!item.children?.length) {
                    return (
                      <div key={item.label} className="border-b border-background/10 pb-3">
                        <Link href={item.href} className="text-sm text-background/75 transition-colors hover:text-gold">
                          {item.label}
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div key={item.label} className="border-b border-background/10 pb-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 text-left text-sm text-background/85 transition-colors hover:text-gold"
                        onClick={() => toggleSection(item.label)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isOpen ? (
                        <div className="mt-3 flex flex-col gap-2 pl-1">
                          <Link href={item.href} className="text-sm font-medium text-gold">
                            Ver categoría
                          </Link>
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="text-sm text-background/70 transition-colors hover:text-gold"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-1">
              <div>
                <h4 className="mb-5 font-display text-lg text-background">Contacto</h4>
                <ul className="space-y-3 text-sm text-background/70">
                  <li>
                    <a href="tel:+34693039422" className="transition-colors hover:text-gold">
                      693 039 422
                    </a>
                  </li>
                  <li>info@personalizadoshosteleria.com</li>
                  <li>España - Envíos a toda Europa</li>
                  <li>Atención directa de 9:00 a 19:00</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-5 font-display text-lg text-background">Legal</h4>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.name}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className="text-sm text-background/70 transition-colors hover:text-gold"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-background/70 transition-colors hover:text-gold">
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
    </>
  );
}
