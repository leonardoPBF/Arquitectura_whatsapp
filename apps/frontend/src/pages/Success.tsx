import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import api from "@/services/api";

export default function Success() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Error al obtener la orden:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return (
    <>
      <Navbar />
      <div className="p-10 text-center text-gray-600">Cargando orden...</div>
    </>
  );
  
  if (!order) return (
    <>
      <Navbar />
      <div className="p-10 text-center text-red-600">No se encontró la orden.</div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 dark:bg-gray-950 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-green-600 text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-gray-800">¡Pago completado con éxito!</h1>
          <p className="text-gray-600 mt-2">
            Gracias por tu compra en <span className="font-semibold bg-gradient-to-r from-[#10B981] to-[#14B8A6] bg-clip-text text-transparent">LUMINA</span>, {order.customerId?.name}. Tu pedido ha sido confirmado.
          </p>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Detalles de la orden
          </h2>
          <p><strong>Número de Orden:</strong> {order.orderNumber}</p>
          <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Estado:</strong> {order.paymentStatus}</p>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Productos</h3>
          <ul className="space-y-2">
            {order.items.map((item: any) => (
              <li
                key={item._id}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
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
                    <p className="text-sm text-gray-600">
                      {item.quantity} x S/{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-800">
                  S/{(item.quantity * item.price).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t pt-4 flex justify-between text-lg font-semibold text-gray-800">
          <span>Total pagado:</span>
          <span>S/{order.totalAmount.toFixed(2)}</span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-3">
            Tu pedido será enviado a:  
            <span className="block font-semibold">{order.deliveryAddress}</span>
          </p>
          <Link
            to="/"
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
