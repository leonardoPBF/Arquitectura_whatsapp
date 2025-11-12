import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI, culqiAPI } from '@/services/api';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['customer-orders', user?.customerId],
    queryFn: async () => {
      const response = await ordersAPI.getAllOrders();
      return response.data;
    },
    enabled: !!user?.customerId,
  });

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
      
      // Buscar si ya existe una orden de Culqi para este pedido
      const response = await culqiAPI.createOrder({
        orderId: order._id,
        method: 'card',
      });

      if (response.data.checkoutUrl) {
        // Si hay checkout URL, redirigir
        navigate(`/checkout?order=${response.data.culqiOrder.id}`);
      } else if (response.data.culqiOrder?.id) {
        // Si solo hay ID de orden Culqi, redirigir al checkout
        navigate(`/checkout?order=${response.data.culqiOrder.id}`);
      } else {
        alert('No se pudo generar el enlace de pago. Intenta nuevamente.');
      }
    } catch (error: any) {
      console.error('Error al procesar pago:', error);
      alert(error.response?.data?.message || 'Error al iniciar el proceso de pago');
    } finally {
      setLoadingPayment(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6 lg:p-8">
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
      <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Pedidos</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Historial de tus compras y pedidos
          </p>
        </div>

        {myOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No tienes pedidos todavía
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order: any) => (
              <Card key={order._id}>
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
                      <p className="text-2xl font-bold">
                        S/ {order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                        <p className="font-medium">{getStatusLabel(order.status)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pago</p>
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
                            className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded"
                          >
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-gray-600 dark:text-gray-400">
                                Cantidad: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">
                              S/ {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dirección de entrega
                        </p>
                        <p className="text-sm">{order.deliveryAddress}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Notas</p>
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    )}

                    {/* Payment Button */}
                    {order.paymentStatus === 'pending' && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handlePayOrder(order)}
                          disabled={loadingPayment === order._id}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
                      <div className="pt-4 border-t">
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Pago completado exitosamente
                        </div>
                      </div>
                    )}

                    {order.paymentStatus === 'failed' && (
                      <div className="pt-4 border-t">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Pago fallido. Por favor, intenta nuevamente.
                        </div>
                        <Button
                          onClick={() => handlePayOrder(order)}
                          disabled={loadingPayment === order._id}
                          className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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

