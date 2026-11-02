
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
      <nav className="container mx-auto flex items-center justify-between h-16 px-6">
        <a href="#" className="flex items-center gap-3 font-display font-bold text-lg">
          <img
            src="https://i.ibb.co/9k50nCtb/Whats-App-Image-2025-11-13-at-1-47-03-AM-removebg-preview.png"
            alt="Lumina Logo"
            className="h-10 w-auto object-contain"
          />
          <span className="text-gradient font-extrabold text-xl tracking-tight">Lumina</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#solucion" className="hover:text-foreground transition-smooth">Solución</a>
          <a href="#caracteristicas" className="hover:text-foreground transition-smooth">Características</a>
          <a href="#proposito" className="hover:text-foreground transition-smooth">Propósito</a>
          <a href="#contacto" className="hover:text-foreground transition-smooth">Contacto</a>
        </div>
        <Button variant="default" size="sm" className="bg-gradient-button text-primary-foreground hover:opacity-90 font-medium">
          Solicitar demo
        </Button>
      </nav>
    </header>
  );
};

export default Navbar;
