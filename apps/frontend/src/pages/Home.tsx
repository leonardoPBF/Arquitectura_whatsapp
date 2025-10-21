import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

export default function Home() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!orderNumber) return setError('Introduce un número de orden (ej: ORD-000008)');

    setLoading(true);
    try {
      const order = await ordersAPI.findOrderByNumber(orderNumber.trim().toUpperCase());
      if (!order) {
        setError('No se encontró la orden con ese número');
        setLoading(false);
        return;
      }

      // Si la orden ya tiene pago completado, ir a success con el _id de la orden
      if (order.paymentStatus === 'paid') {
        navigate(`/success?order=${order._id}`);
        return;
      }

      // Si no hay pago, redirigir al checkout. El backend de Culqi usa un payment.culqiOrderId
      // en su propio flujo; la página /checkout espera ?order=<culqiOrderId>
      // Si el Payment fue creado y asóciado, preferimos abrir checkout por payment.culqiOrderId
      const payment = order.paymentId || null;
      if (payment && payment.culqiOrderId) {
        navigate(`/checkout?order=${payment.culqiOrderId}`);
        return;
      }

      // Fallback: si no hay payment, navegar a la vista de checkout con el id interno de la orden
      navigate(`/checkout?order=${order._id}`);
    } catch (err: any) {
      console.error('Error buscando orden:', err);
      setError(err.response?.data?.message || 'Error al buscar la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Buscar orden</h1>
        <p className="text-sm text-gray-600 mb-6">Introduce tu número de orden (ej: ORD-000008) para ver el estado o completar el pago.</p>

        <form onSubmit={onSearch} className="space-y-4">
          <input
            className="w-full border rounded-lg px-4 py-2"
            placeholder="ORD-000008"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            aria-label="Número de orden"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar orden'}
          </button>

          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
}

