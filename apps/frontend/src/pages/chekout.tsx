import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { culqiAPI } from '../services/api';

const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY;

interface OrderData {
  id: string;
  order_number: string;
  description: string;
  amount: number;
  currency: string;
  state: string;
  customer: {
    email: string;
    name: string;
  };
}

declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const orderRef = useRef<OrderData | null>(null);

  useEffect(() => {
    loadOrderData();
    
    // Cleanup polling al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orderId]);

    useEffect(() => {
    loadOrderData();

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [orderId]);

  useEffect(() => {
    if (orderData) {
      orderRef.current = orderData; // ✅ mantener siempre actualizada la orden
    }
  }, [orderData]);

  // SDK Culqi
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.culqi.com/js/v4";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.Culqi) {
        window.Culqi.publicKey = CULQI_PUBLIC_KEY;
        console.log("✅ Culqi SDK cargado");
      }
    };

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const loadOrderData = async () => {
    if (!orderId) {
      setError("No se proporcionó ID de orden");
      setLoading(false);
      return;
    }

    try {
      const response = await culqiAPI.getOrder(orderId);
      const { payment, culqiOrder } = response.data;

      if (payment.status === "completed") {
        navigate(`/success?order=${orderId}`);
        return;
      }

      if (culqiOrder.state === "expired") {
        setError("Esta orden ha expirado");
        setLoading(false);
        return;
      }

      const orderInfo: OrderData = {
        id: culqiOrder.id,
        order_number: culqiOrder.order_number,
        description: culqiOrder.description,
        amount: culqiOrder.amount,
        currency: culqiOrder.currency_code,
        state: culqiOrder.state,
        customer: {
          email: payment.customerId?.email || "",
          name: payment.customerId?.name || "",
        },
      };

      setOrderData(orderInfo);
      setLoading(false);
    } catch (err: any) {
      console.error("Error al cargar orden:", err);
      setError(err.response?.data?.message || "Error al cargar la orden");
      setLoading(false);
    }
  };

  // ✅ Función corregida
  const openCulqiCheckout = () => {
    const currentOrder = orderRef.current;
    if (!currentOrder || !window.Culqi) {
      setError("Sistema de pago no disponible");
      return;
    }

    try {
      window.Culqi.settings({
        title: "Pago Seguro",
        currency: currentOrder.currency,
        amount: currentOrder.amount,
        order: currentOrder.id,
      });

      window.Culqi.open();
    } catch (err) {
      console.error("Error al abrir Culqi:", err);
      setError("Error al iniciar el proceso de pago");
    }
  };

  // ✅ Callback Culqi corregido
  useEffect(() => {
    window.culqi = async function () {
      const currentOrder = orderRef.current;
      if (!currentOrder) {
        console.error("⚠️ No hay orden activa en Culqi callback");
        return;
      }

      if (window.Culqi.token) {
        const tokenId = window.Culqi.token.id;
        console.log("✅ Token recibido:", tokenId);
        setProcessing(true);
        setError("");

        try {
          const response = await culqiAPI.createCharge({
            tokenId,
            culqiOrderId: searchParams.get('order')+"",
            amount: currentOrder.amount / 100,
            email: currentOrder.customer.email,
          });
          

          if (response.data.success) {
            console.log("💰 Pago exitoso:", response.data);
            startPaymentPolling(); // ✅ verifica el estado mientras
          } else {
            console.error("❌ Error al procesar cargo:", response.data.message);
            setError("El pago no fue procesado correctamente.");
          }
        } catch (err: any) {
          console.error("❌ Error al crear cargo:", err);
          setError("Error al procesar el pago");
        } finally {
          setProcessing(false);
        }
      } else if (window.Culqi.error) {
        console.error("❌ Error de Culqi:", window.Culqi.error);
        setError(window.Culqi.error.user_message || "Error en el proceso de pago");
        setProcessing(false);
      }
    };
  }, []);

  const startPaymentPolling = () => {
    setCheckingPayment(true);
    console.log("🔄 Iniciando verificación de pago...");

    let attempts = 0;
    const maxAttempts = 30;

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      console.log(`🔍 Verificando pago... intento ${attempts}/${maxAttempts}`);

      try {
        const response = await culqiAPI.confirmOrder({
          culqiOrderId: searchParams.get('order')+"",
        });

        if (response.data.success && response.data.payment?.status === "completed") {
          console.log("✅ Pago confirmado!");
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          navigate(`/success?order=${orderId}`);
        } else if (attempts >= maxAttempts) {
          console.log("⏱️ Timeout alcanzado");
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          setError("No se pudo verificar el pago. Por favor, verifica el estado de tu orden.");
        }
      } catch (err) {
        console.error("Error al verificar pago:", err);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-5">
      {(processing || checkingPayment) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 text-center max-w-sm">
            <div className="inline-block w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-800 font-semibold text-lg">
              {checkingPayment ? 'Verificando pago...' : 'Procesando pago...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              No cierres esta ventana
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-10">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-6">
          🛍️
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Completar Pago
        </h1>
        <p className="text-gray-500 text-center mb-8">Pago seguro con Culqi</p>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Orden:</span>
            <span className="text-gray-800 font-semibold">{orderData?.order_number}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Descripción:</span>
            <span className="text-gray-800 font-semibold">{orderData?.description}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 mt-2">
            <span className="text-gray-600 font-bold text-lg">Total a pagar:</span>
            <span className="text-gray-800 font-bold text-xl">
              S/ {((orderData?.amount || 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={openCulqiCheckout}
          disabled={processing || checkingPayment}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          💳 Pagar Ahora
        </button>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-6">
          🔒 Pago 100% seguro y encriptado
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mt-6 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;