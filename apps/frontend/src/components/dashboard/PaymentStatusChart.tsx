import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';
import { CheckCircle, XCircle, Clock, RefreshCcw } from 'lucide-react';

export const PaymentStatusChart = () => {
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
          <CardTitle>Estado de Pagos</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Pagos</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Count payments by status
  const statusCounts = payments.reduce((acc: Record<string, number>, payment: any) => {
    const status = payment.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusConfig = [
    { key: 'completed', label: 'Completados', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { key: 'pending', label: 'Pendientes', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
    { key: 'failed', label: 'Fallidos', icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { key: 'refunded', label: 'Reembolsados', icon: RefreshCcw, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Pagos</CardTitle>
        <CardDescription>Resumen de estados de pago</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusConfig.map((status) => {
            const Icon = status.icon;
            const count = statusCounts[status.key] || 0;
            const percentage = payments.length > 0 ? (count / payments.length) * 100 : 0;

            return (
              <div key={status.key} className={`flex items-center justify-between p-3 rounded-lg ${status.bgColor} border border-current/20 hover:shadow-md transition-all`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${status.bgColor}`}>
                    <Icon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <span className={`font-semibold ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${status.color}`}>{count}</span>
                  <span className={`text-sm font-semibold ${status.color} w-12 text-right`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

