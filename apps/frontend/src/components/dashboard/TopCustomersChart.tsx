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
    <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
      <CardHeader>
        <CardTitle>Mejores Clientes</CardTitle>
        <CardDescription>Top 10 clientes por gasto total</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'gasto' || name === 'Gasto Total (S/)') {
                  return [`S/ ${value.toFixed(2)}`, 'Gasto Total (Soles)'];
                }
                if (name === 'ordenes' || name === 'Total Órdenes') {
                  return [`${value} órdenes`, 'Total de Órdenes'];
                }
                return [value, name];
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
            <Legend />
            <Bar dataKey="gasto" fill="#10B981" name="Gasto Total (S/)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ordenes" fill="#14B8A6" name="Total Órdenes" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

