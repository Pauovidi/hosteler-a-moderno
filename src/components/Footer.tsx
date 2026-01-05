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
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-display font-bold text-primary">
                PH
              </span>
              <span className="text-sm text-muted-foreground leading-tight border-l border-border pl-3">
                Personalizados<br />Hostelería
              </span>
            </a>
            <p className="text-muted-foreground mb-6">
              Su socio estratégico en productos personalizados para el sector HORECA. 
              Calidad premium y entrega récord.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wider">
                Instagram
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wider">
                Facebook
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wider">
                LinkedIn
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-6 uppercase tracking-wider">
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
            <h3 className="text-lg font-display font-semibold text-foreground mb-6 uppercase tracking-wider">
              Contacto
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+34XXX"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Teléfono de contacto
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@personalizadoshosteleria.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@personalizadoshosteleria.com
                </a>
              </li>
              <li>
                <span className="text-muted-foreground">
                  España - Envíos a toda Europa
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-6 uppercase tracking-wider">
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
      <div className="border-t border-border">
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
