import { Zap, Shield, Layers, Globe2, Clock, TrendingUp } from "lucide-react";

const features = [
  { icon: Zap, title: "Tiempo real", desc: "Respuestas instantáneas con arquitectura asincrónica." },
  { icon: Shield, title: "Seguridad", desc: "Protección de datos y cumplimiento integrado." },
  { icon: Layers, title: "Escalable", desc: "Crece sin fricción de 100 a 1M de conversaciones." },
  { icon: Globe2, title: "LATAM-first", desc: "Pensado para el mercado latinoamericano." },
  { icon: Clock, title: "24/7", desc: "Tu negocio nunca duerme. Tu atención tampoco." },
  { icon: TrendingUp, title: "Más ingresos", desc: "Convierte conversaciones en revenue medible." },
];

const Features = () => {
  return (
    <section id="caracteristicas" className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-medium text-accent uppercase tracking-widest">Por qué Lumina</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
            Diseñado para <span className="text-gradient">escalar</span>.
          </h2>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-8 hover:bg-secondary/40 transition-smooth group">
              <f.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-smooth" />
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
