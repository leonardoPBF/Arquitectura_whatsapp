import { Star } from "lucide-react";

const testimonials = [
  {
    name: "María Rodríguez",
    role: "CEO, E-commerce Fashion",
    company: "StyleHub",
    image: "👩‍💼",
    text: "Lumina aumentó nuestras ventas en 45% en los primeros 3 meses. Nuestros clientes aman interactuar directamente en WhatsApp.",
    rating: 5,
  },
  {
    name: "Carlos López",
    role: "Founder, Pizzería Digital",
    company: "PizzaExpress",
    image: "👨‍💼",
    text: "Pasamos de 20 a 200 pedidos diarios sin aumentar staff. El chatbot de Lumina es increíble.",
    rating: 5,
  },
  {
    name: "Daniela Morales",
    role: "Marketing Manager, Retail",
    company: "TiendaMax",
    image: "👩‍💻",
    text: "La integración con nuestro CRM fue sin fricciones. Ahora tenemos visibilidad total del customer journey.",
    rating: 5,
  },
  {
    name: "Juan Pérez",
    role: "Owner, Consultoría",
    company: "BizConsult",
    image: "👨‍💻",
    text: "Reducimos el tiempo de respuesta de 24h a 2 minutos. Nuestros clientes están mucho más satisfechos.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Historias de éxito</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
            Lo que nuestros clientes <span className="text-gradient">dicen</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 hover:bg-secondary/40 transition-smooth group"
            >
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-smooth" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{testimonial.image}</span>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-primary font-medium">{testimonial.company}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
