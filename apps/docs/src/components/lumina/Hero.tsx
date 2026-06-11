import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="container relative mx-auto px-6 max-w-6xl">
        <div className="flex flex-col items-center text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Comercio conversacional con IA · 2026
          </div>

          <h1 className="mt-8 font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tighter">
            Convierte cada chat
            <br />
            en una <span className="text-gradient">venta</span>.
          </h1>

          <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            Lumina es la plataforma de <span className="text-foreground font-medium">comercio conversacional</span> que automatiza ventas, atención al cliente y gestión de pedidos directamente en WhatsApp — con IA en tiempo real.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Button size="lg" className="bg-gradient-button text-primary-foreground hover:opacity-90 shadow-glow font-medium px-8 h-12 text-base group">
              Empezar ahora
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
            </Button>
            <Button size="lg" variant="outline" className="border-border bg-card/40 backdrop-blur hover:bg-card h-12 px-8 text-base">
              <MessageCircle className="mr-2 h-4 w-4" />
              Ver demo en vivo
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16 text-center">
            {[
              { k: "99.9%", v: "Uptime garantizado" },
              { k: "+30%", v: "Conversión de ventas" },
              { k: "<2s", v: "Tiempo de respuesta" },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-display text-3xl md:text-4xl font-bold text-gradient">{s.k}</div>
                <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
