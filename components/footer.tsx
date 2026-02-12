import Link from "next/link";

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
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-gold flex items-center justify-center">
                <span className="text-primary-foreground font-display text-xl font-bold">
                  PH
                </span>
              </div>
              <span className="font-display text-lg text-background">
                Personalizados Hosteleria
              </span>
            </Link>
            <p className="text-background/70 mb-6 leading-relaxed">
              Su socio estrategico en productos personalizados para el sector HORECA. 
              Calidad premium y entrega record.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/70 hover:text-gold transition-colors text-sm">
                Instagram
              </a>
              <a href="#" className="text-background/70 hover:text-gold transition-colors text-sm">
                Facebook
              </a>
              <a href="#" className="text-background/70 hover:text-gold transition-colors text-sm">
                LinkedIn
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg text-background mb-6">
              Productos
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg text-background mb-6">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <p className="text-background/70">
                  Telefono de contacto
                </p>
              </li>
              <li>
                <p className="text-background/70">
                  info@personalizadoshosteleria.com
                </p>
              </li>
              <li>
                <p className="text-background/70">
                  Espana - Envios a toda Europa
                </p>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-lg text-background mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-background/70 hover:text-gold transition-colors"
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
            <p className="text-background/50 text-sm">
              Soluciones integrales para el sector HORECA
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
