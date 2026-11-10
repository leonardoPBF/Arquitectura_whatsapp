import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import api from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { takePurchasedCart } from '@/lib/purchased-cart';

export default function Success() {
  const { removePurchasedItems } = useCart();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        setOrder(res.data);
        if (res.data.paymentStatus === 'paid' && user) {
          const purchased = takePurchasedCart(user.id, orderId);
          if (purchased.length) removePurchasedItems(purchased);
        }
      } catch (err) {
        console.error('Error al obtener la orden:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user?.id, removePurchasedItems]);

  if (loading) return (
    <>
      <Navbar />
      <div className="p-10 text-center text-muted-foreground">Cargando orden...</div>
    </>
  );
  
  if (!order) return (
    <>
      <Navbar />
      <div className="p-10 text-center text-red-600">No se encontró la orden.</div>
    </>
  );

  if (order.paymentStatus !== 'paid') return (
    <><Navbar /><div role="status" className="p-10 text-center space-y-4">
      <p>El pago aún no está confirmado. Tu carrito se conserva.</p>
      <Link to="/my-orders" className="underline text-emerald-700 dark:text-emerald-300">Revisar mis pedidos</Link>
    </div></>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 dark:bg-background p-6">
      <div className="bg-card text-foreground border border-border rounded-2xl shadow-sm p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-green-600 text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-foreground">¡Pago completado con éxito!</h1>
          <p className="text-muted-foreground mt-2">
            Gracias por tu compra en <span className="font-semibold text-foreground">LUMINA</span>, {order.customerId?.name}. Tu pedido ha sido confirmado.
          </p>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Detalles de la orden
          </h2>
          <p><strong>Número de Orden:</strong> {order.orderNumber}</p>
          <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Estado:</strong> {order.paymentStatus}</p>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">Productos</h3>
          <ul className="space-y-2">
            {order.items.map((item: any) => (
              <li
                key={item._id}
                className="flex items-center justify-between bg-muted p-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.productId?.imageUrl}
                    alt={item.productName}
                    className="w-14 h-14 rounded-lg object-cover"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.src = '/placeholder-100.png';
                    }}
                  />
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x S/{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-foreground">
                  S/{(item.quantity * item.price).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t pt-4 flex justify-between text-lg font-semibold text-foreground">
          <span>Total pagado:</span>
          <span>S/{order.totalAmount.toFixed(2)}</span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground mb-3">
            Tu pedido será enviado a:  
            <span className="block font-semibold">{order.deliveryAddress}</span>
          </p>
          <Link
            to="/tienda"
            className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
