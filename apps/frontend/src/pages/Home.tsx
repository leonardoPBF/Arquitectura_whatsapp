import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';
import { Navbar } from '@/components/Navbar';
import { WelcomeCard, FeaturedProducts, AllProducts } from '@/components/HomeComponents';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Todos');

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
        <div className="min-h-screen bg-muted dark:bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground dark:text-muted-foreground">Cargando productos...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const categories = products
    ? ['Todos', ...Array.from(new Set<string>(products.map((p: { category?: string }) => p.category).filter((category: unknown): category is string => typeof category === 'string')))]
    : ['Todos'];

  const filteredProducts = products
    ? selectedCategory === 'Todos'
      ? products
      : products.filter((p: any) => p.category === selectedCategory)
    : [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Welcome Card */}
          <WelcomeCard userName={user?.name} />

          {/* Featured Products */}
          {products && products.length > 0 && selectedCategory === 'Todos' && (
            <FeaturedProducts products={products} />
          )}

          {/* Catalog Section */}
          <div className="space-y-6">
            <div className="border-t dark:border-border pt-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">Nuestro Catálogo</h2>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Explora nuestra variedad de productos de alta calidad seleccionados para ti
                  </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isActive = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground text-white shadow-md shadow-emerald-500/10'
                            : 'bg-card dark:bg-card text-muted-foreground dark:text-foreground border border-border dark:border-border hover:bg-muted dark:hover:bg-card'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All Products */}
              {products && <AllProducts products={filteredProducts} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

