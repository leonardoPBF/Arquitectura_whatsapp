import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

export const TopCustomersChart = () => {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mejores Clientes</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!analytics || analytics.topCustomers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mejores Clientes</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = analytics.topCustomers.map((customer) => ({
    name: customer.name.length > 15 ? customer.name.substring(0, 15) + '...' : customer.name,
    fullName: customer.name,
    gasto: customer.totalSpent,
    ordenes: customer.totalOrders,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mejores Clientes</CardTitle>
        <CardDescription>Top 10 clientes por gasto total</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'gasto') return [`S/ ${value.toFixed(2)}`, 'Gasto Total'];
                return [value, 'Órdenes'];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullName;
                }
                return label;
              }}
            />
            <Legend />
            <Bar dataKey="gasto" fill="#8884d8" name="Gasto Total (S/)" />
            <Bar dataKey="ordenes" fill="#82ca9d" name="Total Órdenes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

