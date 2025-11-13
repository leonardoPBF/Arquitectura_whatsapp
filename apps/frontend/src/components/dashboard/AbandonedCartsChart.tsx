import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ShoppingCart } from 'lucide-react';

export const AbandonedCartsChart = () => {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carritos Abandonados</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const abandonedCarts = analytics?.abandonedCarts || [];
  const totalAbandoned = abandonedCarts.reduce((sum, cart) => sum + cart.totalAmount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Carritos Abandonados
        </CardTitle>
        <CardDescription>Órdenes pendientes sin pago</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{abandonedCarts.length}</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">carritos</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">S/ {totalAbandoned.toFixed(2)}</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">valor total</span>
          </div>
          {abandonedCarts.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Detalles:</p>
              {abandonedCarts.slice(0, 10).map((cart) => (
                <div
                  key={cart._id}
                  className="flex justify-between items-center p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-medium">{cart.orderNumber}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{cart.customerPhone}</p>
                  </div>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">S/ {cart.totalAmount.toFixed(2)}</p>
                </div>
              ))}
              {abandonedCarts.length > 10 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium">
                  +{abandonedCarts.length - 10} más
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

