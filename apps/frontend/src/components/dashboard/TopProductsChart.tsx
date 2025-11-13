import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';

export const TopProductsChart = () => {
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await analyticsAPI.getAllOrders();
      return response.data;
    },
  });

  if (loadingOrders) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate product sales - agrupar por nombre del producto (no por ID)
  // Esto asegura que productos con el mismo nombre se sumen correctamente
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  orders.forEach((order: any) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const productName = item.productName || 'Producto sin nombre';
        
        // Usar el nombre del producto como clave para agrupar
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
        }
        
        // Sumar cantidades y ingresos
        productSales[productName].quantity += item.quantity || 0;
        productSales[productName].revenue += (item.price || 0) * (item.quantity || 0);
      });
    }
  });

  // Sort by quantity (cantidad vendida) and get top 10
  const chartData = Object.values(productSales)
    .filter(product => product.quantity > 0) // Solo productos con ventas
    .sort((a, b) => b.quantity - a.quantity) // Ordenar por cantidad descendente
    .slice(0, 10) // Top 10
    .map((product) => ({
      name: product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name,
      fullName: product.name,
      cantidad: product.quantity,
      ingresos: Math.round(product.revenue * 100) / 100, // Redondear a 2 decimales
    }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
          <CardDescription>No hay productos vendidos aún</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>Top 10 productos por cantidad vendida</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis 
              stroke="#6b7280"
              label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'ingresos' || name === 'Ingresos (S/)') {
                  return [`S/ ${value.toFixed(2)}`, 'Ingresos (Soles)'];
                }
                return [`${value} unidades`, 'Cantidad Vendida'];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return (
                    <div className="font-semibold mb-1 text-base">
                      {payload[0].payload.fullName}
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
            />
            <Bar 
              dataKey="cantidad" 
              fill="#10B981" 
              name="Cantidad Vendida"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="ingresos" 
              fill="#14B8A6" 
              name="Ingresos (S/)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

