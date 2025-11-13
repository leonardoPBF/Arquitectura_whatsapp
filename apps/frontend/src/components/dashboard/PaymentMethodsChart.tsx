import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';

const COLORS = ['#10B981', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
};

export const PaymentMethodsChart = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await analyticsAPI.getAllPayments();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Count payments by method
  const methodCounts = payments.reduce((acc: Record<string, number>, payment: any) => {
    const method = payment.method || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(methodCounts).map(([method, count]) => ({
    name: methodLabels[method] || method,
    value: count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>
        <CardDescription>Distribución de pagos por método</CardDescription>
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

