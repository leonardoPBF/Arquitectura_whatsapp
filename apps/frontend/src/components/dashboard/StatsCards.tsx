import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export const StatsCards = () => {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Cargando...</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const paidOrders = analytics.orders?.filter((o) => o.paymentStatus === 'paid').length || 0;
  const conversionRate = analytics.totalOrders > 0 
    ? ((paidOrders / analytics.totalOrders) * 100).toFixed(1)
    : '0';

  const stats = [
    {
      title: 'Ingresos Totales',
      value: `S/ ${analytics.totalRevenue.toFixed(2)}`,
      description: 'Total de ingresos de órdenes pagadas',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total de Órdenes',
      value: analytics.totalOrders.toString(),
      description: 'Todas las órdenes registradas',
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      title: 'Clientes Activos',
      value: analytics.topCustomers.length.toString(),
      description: 'Clientes con órdenes registradas',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Tasa de Conversión',
      value: `${conversionRate}%`,
      description: 'Órdenes pagadas vs total',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

