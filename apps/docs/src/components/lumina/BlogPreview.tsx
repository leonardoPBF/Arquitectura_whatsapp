import { ArrowRight, Calendar } from "lucide-react";

const posts = [
  {
    title: "Cómo aumentar ventas 45% con chatbots en WhatsApp",
    excerpt: "Descubre las estrategias que las empresas más exitosas usan para convertir conversaciones en dinero.",
    date: "Hace 2 días",
    category: "Tips & Tricks",
    icon: "📈",
  },
  {
    title: "Guía completa: Integraciones con sistemas legacy",
    excerpt: "Conecta fácilmente Lumina con ERPs antiguos sin necesidad de intermediarios costosos.",
    date: "Hace 5 días",
    category: "Integración",
    icon: "🔗",
  },
  {
    title: "2026: Tendencias de comercio conversacional en LATAM",
    excerpt: "Análisis profundo sobre cómo las empresas latinoamericanas están adoptando IA para ventas.",
    date: "Hace 1 semana",
    category: "Análisis",
    icon: "🌐",
  },
];

const BlogPreview = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between mb-16">
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-widest">Blog</span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
              Aprende a <span className="text-gradient">crecer</span>
            </h2>
          </div>
          <button className="hidden md:flex items-center gap-2 text-primary hover:text-primary/80 font-medium group">
            Ver todos los artículos
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 hover:border-primary/40 transition-smooth cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-smooth" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-widest">{post.category}</span>
                  <span className="text-3xl">{post.icon}</span>
                </div>

                <h3 className="mt-6 font-display text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-smooth">
                  {post.title}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>

                <div className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {post.date}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium group">
            Ver todos los artículos
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
