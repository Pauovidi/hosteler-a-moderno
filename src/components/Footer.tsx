import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin } from "lucide-react";

const quickLinks = [
  { name: "Servilletas", href: "#servilletas" },
  { name: "Cristalería", href: "#cristaleria" },
  { name: "Vajilla", href: "#vajilla" },
  { name: "Cubertería", href: "#cuberteria" },
  { name: "Textil Hoteles", href: "#textil" },
];

const legalLinks = [
  { name: "Aviso Legal", href: "#" },
  { name: "Política de Privacidad", href: "#" },
  { name: "Política de Cookies", href: "#" },
];

export const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border/50">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-display font-bold text-gradient-gold">
                PH
              </span>
              <span className="text-sm text-muted-foreground leading-tight">
                Personalizados<br />Hostelería
              </span>
            </a>
            <p className="text-muted-foreground mb-6">
              Su socio estratégico en productos personalizados para el sector HORECA. 
              Calidad premium y entrega récord.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Instagram className="w-4 h-4 text-primary" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Facebook className="w-4 h-4 text-primary" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Linkedin className="w-4 h-4 text-primary" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-6">
              Productos
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-6">
              Contacto
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+34XXX"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Teléfono de contacto</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@personalizadoshosteleria.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>info@personalizadoshosteleria.com</span>
                </a>
              </li>
              <li>
                <span className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-1" />
                  <span>España - Envíos a toda Europa</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-6">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
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
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Personalizados Hostelería S.L. Todos los derechos reservados.
            </p>
            <p>
              Soluciones integrales para el sector HORECA
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
