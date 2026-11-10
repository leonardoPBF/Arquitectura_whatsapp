import { chartTooltipStyle } from './chart-theme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

export const RevenueChart = () => {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Mes</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!analytics || analytics.revenueByMonth.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Mes</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = analytics.revenueByMonth.map((item) => ({
    mes: new Date(item.month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
    ingresos: item.revenue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por Mes</CardTitle>
        <CardDescription>Evolución de ingresos en los últimos meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} dataKey="mes" />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ingresos']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ingresos"
              stroke="var(--chart-1)"
              strokeWidth={3}
              name="Ingresos (S/)"
              dot={{ fill: 'var(--chart-2)', r: 5 }}
              activeDot={{ r: 7, fill: 'var(--chart-1)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

