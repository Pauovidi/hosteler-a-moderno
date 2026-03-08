import Link from "next/link";
import { WhatsAppButton } from "@/components/whatsapp-button";

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

const prefooterText = "Trabajamos básicamente productos de Hostelería, los personalizamos con su logo y todos nuestros precios llevan incluidos los gastos, incluso los de envío. Grabamos o personalizamos en CRISTAL: Copas de Vino, Copas de Cerveza, Jarras de Cerveza, Vasos de Cerveza, Copas de Gin Tonic o Combinados y otros elementos de cristal. También personalizamos : Mantelería Textil, Servilleteros de madera y diferentes elementos para lectura de Código QR de tu menú o presentación de establecimiento. Y por supuesto todo tipo de servilletas para hostelería, tanto en tissue, airlaid, en formato canguro y 1/8, además de Miniservice y Cocktail.";

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a2.95 2.95 0 0 0-2.08-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.42.5A2.95 2.95 0 0 0 .5 6.2 30.7 30.7 0 0 0 0 12a30.7 30.7 0 0 0 .5 5.8 2.95 2.95 0 0 0 2.08 2.1c1.82.5 9.42.5 9.42.5s7.6 0 9.42-.5a2.95 2.95 0 0 0 2.08-2.1A30.7 30.7 0 0 0 24 12a30.7 30.7 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.4 3.6-6.4 3.6Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.88 3.78-3.88 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.88h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8A3.6 3.6 0 0 0 20 16.4V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A1.97 1.97 0 1 0 5.3 7a1.97 1.97 0 0 0-.05-4ZM20 13.17c0-3.45-1.84-5.05-4.3-5.05a3.73 3.73 0 0 0-3.36 1.85V8.5H9V20h3.38v-6.17c0-1.63.31-3.22 2.33-3.22 1.99 0 2.02 1.86 2.02 3.32V20H20v-6.83Z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UC23W16JZbkHXdK3gU_0R-MQ",
    icon: YouTubeIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/personalizadoshosteleria",
    icon: FacebookIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/?utm_source=pwa_homescreen",
    icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/personalizados-hosteler%C3%ADa-4239791a4/",
    icon: LinkedInIcon,
  },
];

export function Footer() {
  return (
    <>
      <section className="bg-background border-t border-border/60">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <p className="text-sm md:text-base text-foreground/80 leading-relaxed">{prefooterText}</p>
        </div>
      </section>

      <footer className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6" aria-label="Personalizados Hosteleria">
                <img src="/logo-3.jpg" alt="Personalizados Hosteleria" className="h-12 w-auto rounded-sm" />
                <span className="font-display text-lg text-background">Personalizados Hosteleria</span>
              </Link>
              <p className="text-background/70 mb-6 leading-relaxed">
                Su socio estrategico en productos personalizados para el sector HORECA.
                Calidad premium y entrega record.
              </p>
              <div className="flex gap-4">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/20 text-background/80 hover:text-gold hover:border-gold transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

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

            <div>
              <h4 className="font-display text-lg text-background mb-6">Contacto</h4>
              <ul className="space-y-3 text-background/70">
                <li>
                  <a href="tel:+34693039422" className="hover:text-gold transition-colors">693 039 422</a>
                </li>
                <li>info@personalizadoshosteleria.com</li>
                <li>Espana - Envios a toda Europa</li>
                <li>Horario: Tienda online 24 horas - Atención directa 9.00 a 19.00</li>
              </ul>
            </div>

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

      <WhatsAppButton />
    </>
  );
}