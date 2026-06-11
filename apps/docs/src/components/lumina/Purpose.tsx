import { Target, Eye } from "lucide-react";

const Purpose = () => {
  return (
    <section id="proposito" className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Nuestro propósito</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
            Misión & <span className="text-gradient">Visión</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <article className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card backdrop-blur p-10 shadow-card">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="mt-8 font-display text-2xl md:text-3xl font-bold">Misión</h3>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Empoderar a empresas y emprendedores en Latinoamérica automatizando sus procesos de venta y atención al cliente mediante experiencias conversacionales inteligentes — accesibles, eficientes y centradas en las personas.
              </p>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card backdrop-blur p-10 shadow-card">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/30 text-accent">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="mt-8 font-display text-2xl md:text-3xl font-bold">Visión</h3>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Ser la plataforma líder de comercio conversacional en Latinoamérica para 2030, redefiniendo cómo los negocios se conectan con sus clientes a través de la inteligencia artificial y la innovación tecnológica.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Purpose;
