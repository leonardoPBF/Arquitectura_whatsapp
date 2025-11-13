import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';

const COLORS = {
  bajo: '#ef4444',      // rojo para stock bajo (< 10)
  medio: '#f59e0b',     // amarillo para stock medio (10-20)
  alto: '#10b981',      // verde para stock alto (> 20)
};

const getStockColor = (stock: number) => {
  if (stock < 10) return COLORS.bajo;
  if (stock <= 20) return COLORS.medio;
  return COLORS.alto;
};

export const ProductStockChart = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await analyticsAPI.getAllProducts();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle>Stock de Productos</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle>Stock de Productos</CardTitle>
          <CardDescription>No hay productos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Filtrar solo productos activos y ordenar por stock (menor a mayor)
  const chartData = products
    .filter((product: any) => product.isActive !== false)
    .sort((a: any, b: any) => a.stock - b.stock)
    .slice(0, 15) // Top 15 productos con menor stock
    .map((product: any) => ({
      name: product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name,
      fullName: product.name,
      stock: product.stock || 0,
      categoria: product.category || 'Sin categoría',
      color: getStockColor(product.stock || 0),
    }));

  return (
    <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
      <CardHeader>
        <CardTitle>Stock de Productos</CardTitle>
        <CardDescription>Top 15 productos con menor stock (requieren atención)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={150}
              tick={{ fontSize: 13, fontWeight: 500 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value} unidades`, 'Stock']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="mb-2">
                      <div className="text-lg font-bold mb-1">{data.fullName}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Categoría: {data.categoria}
                      </div>
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Stock: {data.stock} unidades
                      </div>
                    </div>
                  );
                }
                return label;
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'stock') return 'Stock';
                return value;
              }}
            />
            <Bar dataKey="stock" name="stock" radius={[0, 4, 4, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.bajo }}></div>
            <span>Stock Bajo (&lt; 10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.medio }}></div>
            <span>Stock Medio (10-20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.alto }}></div>
            <span>Stock Alto (&gt; 20)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

