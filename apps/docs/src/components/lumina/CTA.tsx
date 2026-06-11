import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section id="contacto" className="py-24 relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-card backdrop-blur p-12 md:p-20 text-center shadow-glow">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
              Lleva tu negocio a la <br />
              <span className="text-gradient">era conversacional</span>.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
              Agenda una demo personalizada y descubre cuánto puedes crecer con Lumina.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-button text-primary-foreground hover:opacity-90 shadow-glow h-12 px-8 text-base group">
                Solicitar demo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button size="lg" variant="outline" className="border-border bg-card/40 h-12 px-8 text-base">
                Hablar con ventas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
