import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function Home() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await analyticsAPI.getAllProducts();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-center">Cargando productos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Bienvenido a Nuestra Tienda</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explora nuestro catálogo de productos
            </p>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <Card key={product._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
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
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">S/ {product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stock: {product.stock} unidades
                        </p>
                      </div>
                      <button className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Agregar
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No hay productos disponibles en este momento
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

