import { Bot, ShoppingCart, Headphones, BarChart3 } from "lucide-react";

const items = [
  {
    icon: Bot,
    title: "Chatbot inteligente",
    desc: "IA conversacional que entiende a tus clientes, responde 24/7 y aprende de cada interacción.",
  },
  {
    icon: ShoppingCart,
    title: "Pedidos automatizados",
    desc: "De la consulta al checkout sin salir de WhatsApp. Confirmación, pago y seguimiento al instante.",
  },
  {
    icon: Headphones,
    title: "Atención escalable",
    desc: "Resuelve miles de conversaciones simultáneas con derivación inteligente a tu equipo humano.",
  },
  {
    icon: BarChart3,
    title: "Analítica en tiempo real",
    desc: "Dashboard con KPIs de ventas, satisfacción y rendimiento operativo en un solo lugar.",
  },
];

const Solution = () => {
  return (
    <section id="solucion" className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="max-w-2xl">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">La solución</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">
            Una plataforma. <br />
            <span className="text-muted-foreground">Todo el ciclo de venta.</span>
          </h2>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-5">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card backdrop-blur p-8 shadow-card hover:border-primary/40 transition-smooth"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-smooth" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solution;
