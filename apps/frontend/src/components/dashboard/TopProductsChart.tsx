import { chartTooltipStyle } from './chart-theme';
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
      <Card className="bg-card dark:bg-card border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
          <CardDescription>No hay productos vendidos aún</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-card border-[hsl(var(--border))]">
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>Top 10 productos por cantidad vendida</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                if (name === 'ingresos' || name === 'Ingresos (S/)') {
                  return [`S/ ${value.toFixed(2)}`, 'Ingresos (Soles)'];
                }
                return [`${value} unidades`, 'Cantidad Vendida'];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0] && payload[0].payload?.fullName) {
                  return payload[0].payload.fullName;
                }
                return label;
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                marginBottom: '4px',
                fontSize: '16px',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar
              dataKey="cantidad"
              fill="var(--chart-1)"
              name="Cantidad Vendida"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="ingresos"
              fill="var(--chart-2)"
              name="Ingresos (S/)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

