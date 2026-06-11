import { Box } from "lucide-react";

const integrations = [
  { name: "Stripe", icon: "💳", desc: "Pagos en tiempo real" },
  { name: "Shopify", icon: "🛒", desc: "Sincronización de productos" },
  { name: "HubSpot", icon: "🎯", desc: "CRM y automatización" },
  { name: "Zapier", icon: "⚙️", desc: "1000+ integraciones" },
  { name: "Google Sheets", icon: "📊", desc: "Sincronización de datos" },
  { name: "Slack", icon: "💬", desc: "Notificaciones en equipo" },
  { name: "Telegram", icon: "✈️", desc: "Mensajería adicional" },
  { name: "Make", icon: "🔗", desc: "Automatización avanzada" },
];

const Integrations = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Integraciones</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
            Conecta Lumina con tus <span className="text-gradient">herramientas favoritas</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 hover:border-primary/40 transition-smooth cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
              <div className="relative">
                <div className="text-4xl mb-3">{integration.icon}</div>
                <h3 className="font-semibold text-foreground">{integration.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{integration.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            ¿Necesitas una integración específica? Tenemos API abierta.
          </p>
          <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <Box className="h-4 w-4" />
            Ver documentación de API
          </button>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
