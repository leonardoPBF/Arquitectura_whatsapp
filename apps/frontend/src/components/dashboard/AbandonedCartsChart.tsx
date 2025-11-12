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
            <span className="text-3xl font-bold">{abandonedCarts.length}</span>
            <span className="text-gray-600 dark:text-gray-400">carritos</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">S/ {totalAbandoned.toFixed(2)}</span>
            <span className="text-gray-600 dark:text-gray-400">valor total</span>
          </div>
          {abandonedCarts.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium">Detalles:</p>
              {abandonedCarts.slice(0, 10).map((cart) => (
                <div
                  key={cart._id}
                  className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                >
                  <div>
                    <p className="font-medium">{cart.orderNumber}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cart.customerPhone}</p>
                  </div>
                  <p className="font-semibold">S/ {cart.totalAmount.toFixed(2)}</p>
                </div>
              ))}
              {abandonedCarts.length > 10 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
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

