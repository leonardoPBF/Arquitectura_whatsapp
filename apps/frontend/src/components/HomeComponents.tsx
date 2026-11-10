import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';

export const WelcomeCard = ({ userName }: { userName?: string }) => (
  <section className="rounded-2xl border border-border bg-card p-8 md:p-10 text-foreground">
    <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">TU SELECCIÓN LUMINA</p>
    <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>Bienvenido, {userName || 'Cliente'}.</h1>
    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">Explora la colección y encuentra tu próximo favorito. Consulta tus compras y pagos desde Mis Pedidos.</p>
  </section>
);

export const FeaturedProducts = ({ products }: { products: any[] }) => {
  const { addItem } = useCart();
  
  // Mostrar los primeros productos del catálogo.
  const featured = products.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground dark:text-white">Productos destacados</h2>
        </div>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Una selección de nuestra colección para empezar a explorar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured.map((product) => {

          return (
            <Card
              key={product._id}
              className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
            >
              {/* Selección del catálogo */}
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold z-10">
                Selección LUMINA
              </div>

              <CardHeader className="pb-3">
                <div className="relative">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.src = '/placeholder-image.png';
                      }}
                    />
                  )}
                </div>
                <CardTitle className="line-clamp-2">{product.name}</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      S/ {product.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    Stock: {product.stock} unidades
                  </p>
                </div>

                <Button
                  onClick={() => addItem(product, 1)}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground font-bold shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-150"
                >
                  Agregar al Carrito
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const AllProducts = ({ products }: { products: any[] }) => {
  const { addItem } = useCart();

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground dark:text-muted-foreground">
            No hay productos disponibles en este momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product._id}
            className="hover:shadow-lg transition-shadow overflow-hidden"
          >
            <CardHeader className="pb-3">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.src = '/placeholder-image.png';
                  }}
                />
              )}
              <CardTitle className="line-clamp-2">{product.name}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    S/ {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    Stock: {product.stock}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => addItem(product, 1)}
                className="w-full bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground font-bold shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-150"
              >
                Agregar al Carrito
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
