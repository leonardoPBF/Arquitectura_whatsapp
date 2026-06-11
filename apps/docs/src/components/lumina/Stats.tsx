const stats = [
  { number: "500+", label: "Empresas activas", icon: "🏢" },
  { number: "10M+", label: "Mensajes procesados", icon: "💬" },
  { number: "45%", label: "Aumento promedio en ventas", icon: "📈" },
  { number: "2s", label: "Tiempo de respuesta", icon: "⚡" },
];

const Stats = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-5xl mb-3">{stat.icon}</div>
              <div className="font-display text-4xl md:text-5xl font-bold text-gradient">{stat.number}</div>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
