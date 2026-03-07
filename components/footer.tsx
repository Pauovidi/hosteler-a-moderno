import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

const quickLinks = [
  { name: "Servilletas", href: "#servilletas" },
  { name: "Cristaleria", href: "#cristaleria" },
  { name: "Vajilla", href: "#vajilla" },
  { name: "Cuberteria", href: "#cuberteria" },
  { name: "Textil Hoteles", href: "#textil" },
];

const legalLinks = [
  { name: "Aviso Legal", href: "#" },
  { name: "Politica de Privacidad", href: "#" },
  { name: "Politica de Cookies", href: "#" },
  {
    name: "Devoluciones",
    href: "http://personalizadoshosteleria.com/b24885-politica-de-empresa-sobre-devolucion-de-productos-personalizados.html",
    external: true,
  },
];

const socialLinks = [
  {
    name: "YouTube",
    href: "https://www.youtube.com/channel/UC23W16JZbkHXdK3gU_0R-MQ",
    icon: Youtube,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/personalizadoshosteleria",
    icon: Facebook,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/?utm_source=pwa_homescreen",
    icon: Instagram,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/personalizados-hosteler%C3%ADa-4239791a4/",
    icon: Linkedin,
  },
];

export function Footer() {
  return (
    <>
      <section className="bg-background text-foreground border-t border-border/60">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <p className="text-base leading-relaxed text-foreground/80 max-w-5xl mx-auto">
            Trabajamos básicamente productos de Hostelería, los personalizamos con su logo y todos nuestros precios llevan incluidos los gastos, incluso los de envío. Grabamos o personalizamos en CRISTAL: Copas de Vino, Copas de Cerveza, Jarras de Cerveza, Vasos de Cerveza, Copas de Gin Tonic o Combinados y otros elementos de cristal. También personalizamos : Mantelería Textil, Servilleteros de madera y diferentes elementos para lectura de Código QR de tu menú o presentación de establecimiento. Y por supuesto todo tipo de servilletas para hostelería, tanto en tissue, airlaid, en formato canguro y 1/8, además de Miniservice y Cocktail.
          </p>
        </div>
      </section>

      <footer className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-gold flex items-center justify-center rounded-full overflow-hidden">
                  <img src="/logo-3.jpg" alt="Personalizados Hosteleria" className="w-full h-full object-cover" />
                </div>
                <span className="font-display text-lg text-background">Personalizados Hosteleria</span>
              </Link>
              <p className="text-background/70 mb-6 leading-relaxed">
                Su socio estrategico en productos personalizados para el sector HORECA. Calidad premium y entrega record.
              </p>
              <div className="flex gap-3">
                {socialLinks.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="w-10 h-10 rounded-full border border-background/25 flex items-center justify-center text-background/80 hover:text-gold hover:border-gold transition-colors"
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="sr-only">{name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display text-lg text-background mb-6">Productos</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-background/70 hover:text-gold transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-lg text-background mb-6">Contacto</h4>
              <ul className="space-y-3">
                <li>
                  <a href="tel:+34693039422" className="text-background/70 hover:text-gold transition-colors">
                    693 039 422
                  </a>
                </li>
                <li>
                  <p className="text-background/70">info@personalizadoshosteleria.com</p>
                </li>
                <li>
                  <p className="text-background/70">Horario: Tienda online 24 horas - Atención directa 9.00 a 19.00</p>
                </li>
                <li>
                  <p className="text-background/70">Espana - Envios a toda Europa</p>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-display text-lg text-background mb-6">Legal</h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-gold transition-colors"
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-background/50 text-sm">
                © {new Date().getFullYear()} Personalizados Hosteleria S.L. Todos los derechos reservados.
              </p>
              <p className="text-background/50 text-sm">Soluciones integrales para el sector HORECA</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
