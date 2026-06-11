import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Startup",
    price: 99,
    desc: "Perfecto para pequeños negocios",
    features: [
      "1 bot WhatsApp",
      "Hasta 5,000 conversaciones/mes",
      "Respuestas automáticas básicas",
      "Integración con 3 servicios",
      "Dashboard básico",
      "Soporte por email",
    ],
  },
  {
    name: "Business",
    price: 299,
    desc: "Para empresas en crecimiento",
    highlighted: true,
    features: [
      "5 bots WhatsApp",
      "Hasta 50,000 conversaciones/mes",
      "IA conversacional avanzada",
      "Integración con 20+ servicios",
      "Analytics en tiempo real",
      "Soporte prioritario 24/7",
      "API REST completa",
      "Webhooks personalizados",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Soluciones empresariales",
    features: [
      "Bots ilimitados",
      "Conversaciones ilimitadas",
      "IA personalizada y fine-tuning",
      "Integraciones custom",
      "Soporte dedicado",
      "SLA 99.9% uptime",
      "On-premise option",
      "Capacitación incluida",
    ],
  },
];

const Pricing = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Planes flexibles</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
            Crece con Lumina a tu <span className="text-gradient">ritmo</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Sin compromisos a largo plazo. Cancela cuando quieras.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border transition-smooth ${
                plan.highlighted
                  ? "border-primary/60 bg-gradient-card ring-1 ring-primary/30 md:scale-105 shadow-glow"
                  : "border-border/60 bg-card hover:border-primary/40"
              } p-8`}
            >
              {plan.highlighted && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}

              <div className="relative">
                <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {typeof plan.price === "number" ? (
                    <>
                      <span className="font-display text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </>
                  ) : (
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                  )}
                </div>

                <Button
                  className={`w-full mt-8 group ${
                    plan.highlighted
                      ? "bg-gradient-button text-primary-foreground hover:opacity-90"
                      : "border-border bg-card/40 hover:bg-card"
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Empezar ahora
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </Button>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            ¿Preguntas sobre los planes?{" "}
            <button className="text-primary hover:underline font-medium">Habla con nuestro equipo</button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
