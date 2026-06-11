import { Sparkles, Mail, MapPin, Linkedin, Twitter, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 py-16">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-display font-bold mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-button">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </span>
              <span className="text-gradient">Lumina</span>
            </div>
            <p className="text-xs text-muted-foreground">Comercio conversacional con IA para Latinoamérica.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Características
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Precios
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Integraciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Casos de éxito
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Carreras
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Términos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Compliance
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth">
                  Cookies
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contacto</h4>
            <div className="space-y-3 text-sm">
              <a href="mailto:hello@lumina.ai" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
                <Mail className="h-4 w-4" />
                hello@lumina.ai
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                LATAM, MX
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Lumina. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
