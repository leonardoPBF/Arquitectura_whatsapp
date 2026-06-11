import { Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';

export const WelcomeCard = ({ userName }: { userName?: string }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 p-8 text-white shadow-xl shadow-emerald-500/10 border border-emerald-500/20">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/10 rounded-full -ml-20 -mb-20 blur-2xl" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] md:text-xs font-semibold tracking-wide uppercase mb-3">
          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <span>Bienvenido a LUMINA</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
          ¡Hola, {userName || 'Cliente'}! 👋
        </h1>
        <p className="text-emerald-50/90 text-sm md:text-base max-w-xl mb-6 leading-relaxed">
          Descubre nuestras ofertas exclusivas y compra desde la comodidad de tu hogar.
          Envíos rápidos a todo Perú.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-lg">
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>4.9/5 - 1,200+ clientes</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-lg">
            <span>✓ Pago seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FeaturedProducts = ({ products }: { products: any[] }) => {
  const { addItem } = useCart();
  
  // Simular productos destacados (los primeros 3 o con mayor descuento)
  const featured = products.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ofertas Destacadas</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selección exclusiva de productos con los mejores descuentos por tiempo limitado
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured.map((product, idx) => {
          const discount = Math.floor(Math.random() * 30) + 10; // 10-40% random
          const originalPrice = product.price * (1 + discount / 100);

          return (
            <Card
              key={product._id}
              className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
            >
              {/* Etiqueta de Descuento */}
              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                -{discount}%
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
                    <span className="text-2xl font-bold text-emerald-600">
                      S/ {product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      S/ {originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Stock: {product.stock} unidades
                  </p>
                </div>

                <Button
                  onClick={() => addItem(product, 1)}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90 text-white font-bold shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-150"
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
          <p className="text-gray-600 dark:text-gray-400">
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    S/ {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Stock: {product.stock}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => addItem(product, 1)}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90 text-white font-bold shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all duration-150"
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
