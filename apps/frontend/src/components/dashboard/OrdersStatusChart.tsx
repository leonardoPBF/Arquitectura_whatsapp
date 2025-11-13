import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

const COLORS = ['#10B981', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  preparing: 'Preparando',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

export const OrdersStatusChart = () => {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Órdenes</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!analytics || Object.keys(analytics.ordersByStatus).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Órdenes</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Órdenes</CardTitle>
        <CardDescription>Distribución de órdenes por estado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

