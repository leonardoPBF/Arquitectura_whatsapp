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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Cargando productos...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const categories = products
    ? ['Todos', ...Array.from(new Set(products.map((p: any) => p.category)))]
    : ['Todos'];

  const filteredProducts = products
    ? selectedCategory === 'Todos'
      ? products
      : products.filter((p: any) => p.category === selectedCategory)
    : [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Welcome Card */}
          <WelcomeCard userName={user?.name} />

          {/* Featured Products */}
          {products && products.length > 0 && selectedCategory === 'Todos' && (
            <FeaturedProducts products={products} />
          )}

          {/* Catalog Section */}
          <div className="space-y-6">
            <div className="border-t dark:border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nuestro Catálogo</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            ? 'bg-gradient-to-r from-[#10B981] to-[#14B8A6] text-white shadow-md shadow-emerald-500/10'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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

