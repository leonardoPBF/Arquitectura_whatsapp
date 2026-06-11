import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
      <nav className="container mx-auto flex items-center justify-between h-16 px-6">
        <a href="#" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-button shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-gradient">Lumina</span>
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
