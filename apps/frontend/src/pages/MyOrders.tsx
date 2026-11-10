import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '@/services/api';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { takePurchasedCart } from '@/lib/purchased-cart';
import toast from 'react-hot-toast';

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { removePurchasedItems } = useCart();
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

  const { data: allOrders, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-orders', user?.id, user?.customerId],
    queryFn: async () => {
      const response = await ordersAPI.getAllOrders();
      if (!Array.isArray(response.data)) throw new Error('Respuesta de pedidos inválida');
      return response.data;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user || !allOrders) return;
    for (const order of allOrders) {
      if (order.paymentStatus === 'paid') {
        const purchased = takePurchasedCart(user.id, order._id);
        if (purchased.length) removePurchasedItems(purchased);
      }
    }
  }, [allOrders, user, removePurchasedItems]);

  // Filter orders by customerId (comparing IDs as strings)
  const myOrders = allOrders?.filter((order: any) => {
    const orderCustomerId = typeof order.customerId === 'string' 
      ? order.customerId 
      : order.customerId?._id?.toString() || order.customerId?.toString();
    return orderCustomerId === user?.customerId?.toString();
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      preparing: 'Preparando',
      shipped: 'Enviada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      failed: 'Fallido',
      refunded: 'Reembolsado',
    };
    return labels[status] || status;
  };

  const handlePayOrder = async (order: any) => {
    try {
      setLoadingPayment(order._id);
      
      navigate(`/checkout?order=${encodeURIComponent(order._id)}`);
    } catch (error: any) {
      console.error('Error al procesar pago:', error);
      toast.error(error.response?.data?.message || 'Error al iniciar el proceso de pago');
    } finally {
      setLoadingPayment(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-card dark:bg-background p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <p>Cargando tus pedidos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
            Mis Pedidos
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Historial de tus compras y pedidos
          </p>
        </div>

        {isError ? (
          <Card><CardContent className="py-8 space-y-4" role="alert">
            <p>No pudimos cargar tus pedidos. Intenta nuevamente.</p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </CardContent></Card>
        ) : myOrders.length === 0 ? (
          <Card className="border border-gray-150 dark:border-border">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground dark:text-muted-foreground">
                No tienes pedidos todavía
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order: any) => (
              <Card key={order._id} className="border border-emerald-100/50 dark:border-emerald-950/50 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        {order.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        S/ {order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between pb-2 border-b dark:border-border">
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Estado</p>
                        <p className="font-medium">{getStatusLabel(order.status)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Pago</p>
                        <p className="font-medium">{getPaymentStatusLabel(order.paymentStatus)}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-sm font-medium mb-2">Productos:</p>
                      <div className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm bg-muted dark:bg-card p-2 rounded"
                          >
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-muted-foreground dark:text-muted-foreground">
                                Cantidad: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              S/ {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          Dirección de entrega
                        </p>
                        <p className="text-sm">{order.deliveryAddress}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Notas</p>
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    )}

                    {/* Payment Button */}
                    {order.paymentStatus === 'pending' && order.status !== 'cancelled' && (
                      <div className="pt-4 border-t dark:border-border">
                        <Button
                          onClick={() => handlePayOrder(order)}
                          disabled={loadingPayment !== null}
                          className="w-full bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground font-bold h-12 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-150"
                        >
                          {loadingPayment === order._id ? (
                            <>
                              <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              💳 Pagar Ahora
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Payment Status Info */}
                    {order.paymentStatus === 'paid' && (
                      <div className="pt-4 border-t dark:border-border">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Pago completado exitosamente
                        </div>
                      </div>
                    )}

                    {order.paymentStatus === 'failed' && order.status !== 'cancelled' && (
                      <div className="pt-4 border-t dark:border-border">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Pago fallido. Por favor, intenta nuevamente.
                        </div>
                        <Button
                          onClick={() => handlePayOrder(order)}
                          disabled={loadingPayment !== null}
                          className="w-full mt-2 bg-primary text-primary-foreground hover:opacity-90 text-primary-foreground font-bold h-12 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-150"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Reintentar Pago
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
