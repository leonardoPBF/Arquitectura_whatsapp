const clients = [
  { name: "StyleHub", logo: "🛍️" },
  { name: "PizzaExpress", logo: "🍕" },
  { name: "TiendaMax", logo: "🏬" },
  { name: "BizConsult", logo: "📊" },
  { name: "FashionBox", logo: "👗" },
  { name: "DigitalMarket", logo: "💻" },
  { name: "RetailPro", logo: "💳" },
  { name: "ServiceHub", logo: "🛠️" },
];

const Clients = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Empresas que confían en Lumina
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {clients.map((client) => (
            <div
              key={client.name}
              className="flex items-center justify-center rounded-xl border border-border/40 bg-card/50 p-6 hover:border-primary/40 transition-smooth group cursor-pointer"
            >
              <div className="text-center">
                <div className="text-4xl group-hover:scale-110 transition-smooth">{client.logo}</div>
                <p className="mt-2 text-sm font-medium text-foreground">{client.name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Más de <span className="text-foreground font-bold">500+ empresas</span> en Latinoamérica utilizan Lumina
          </p>
        </div>
      </div>
    </section>
  );
};

export default Clients;
