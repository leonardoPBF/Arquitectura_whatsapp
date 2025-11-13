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
      color: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
    },
    {
      title: 'Total de Órdenes',
      value: analytics.totalOrders.toString(),
      description: 'Todas las órdenes registradas',
      icon: ShoppingBag,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      borderColor: 'border-cyan-300 dark:border-cyan-700',
    },
    {
      title: 'Clientes Activos',
      value: analytics.topCustomers.length.toString(),
      description: 'Clientes con órdenes registradas',
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bgGradient: 'from-violet-500/10 to-purple-500/10',
      borderColor: 'border-violet-300 dark:border-violet-700',
    },
    {
      title: 'Tasa de Conversión',
      value: `${conversionRate}%`,
      description: 'Órdenes pagadas vs total',
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bgGradient: 'from-amber-500/10 to-orange-500/10',
      borderColor: 'border-amber-300 dark:border-amber-700',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={`bg-gradient-to-br ${stat.bgGradient} border-2 ${stat.borderColor} hover:shadow-xl transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.bgGradient}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

