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

  // Calculate product sales
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  orders.forEach((order: any) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.productName || 'Unknown',
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    }
  });

  // Sort by quantity and get top 10
  const chartData = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((product) => ({
      name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
      fullName: product.name,
      cantidad: product.quantity,
      ingresos: product.revenue,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>Top 10 productos por cantidad vendida</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'ingresos') return [`S/ ${value.toFixed(2)}`, 'Ingresos'];
                return [value, 'Cantidad'];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullName;
                }
                return label;
              }}
            />
            <Legend />
            <Bar dataKey="cantidad" fill="#8884d8" name="Cantidad Vendida" />
            <Bar dataKey="ingresos" fill="#82ca9d" name="Ingresos (S/)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

