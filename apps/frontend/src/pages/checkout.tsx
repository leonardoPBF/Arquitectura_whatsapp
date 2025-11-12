import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { culqiAPI } from '../services/api';
import api from '../services/api';
import { Navbar } from '@/components/Navbar';

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

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [culqiOrderId, setCulqiOrderId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRef = useRef<OrderData | null>(null);
  const processingPaymentRef = useRef(false);

  useEffect(() => {
    loadOrderData();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (orderData) {
      orderRef.current = orderData;
    }
  }, [orderData]);

  // Cargar SDK Culqi
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
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(orderId);

      if (isObjectId) {
        // Es un ID de MongoDB
        const res = await api.get(`/api/orders/${orderId}`);
        const order = res.data;

        if (order.paymentStatus === "paid" || order.status === "confirmed") {
          navigate(`/success?order=${order._id}`);
          return;
        }

        // Buscar el payment asociado para obtener el culqiOrderId
        const paymentRes = await api.get(`/api/payments?orderId=${order._id}`);
        const payment = paymentRes.data?.[0];

        if (payment?.culqiOrderId) {
          setCulqiOrderId(payment.culqiOrderId);
          console.log("✅ culqiOrderId encontrado:", payment.culqiOrderId);
        }

        const providedCheckout = searchParams.get('checkoutUrl');

        const orderInfo: OrderData = {
          id: order._id,
          order_number: order.orderNumber,
          description: `Pedido ${order.orderNumber}`,
          amount: Math.round((order.totalAmount || 0) * 100),
          currency: 'PEN',
          state: order.status || 'pending',
          customer: {
            email: order.customerId?.email || "",
            name: order.customerId?.name || "",
          },
        };

        setOrderData(orderInfo);
        setLoading(false);
        if (providedCheckout) setCheckoutUrl(providedCheckout);
        if (payment?.checkoutUrl) setCheckoutUrl(payment.checkoutUrl);
      } else {
        // Es un culqiOrderId
        const resp = await culqiAPI.getOrder(orderId);
        const { payment, culqiOrder } = resp.data;

        if (payment?.status === "completed") {
          const dbOrderId = payment?.orderId?._id || payment?.orderId || null;
          if (dbOrderId) navigate(`/success?order=${dbOrderId}`);
          else navigate(`/success`);
          return;
        }

        setCulqiOrderId(orderId);
        console.log("✅ culqiOrderId (desde URL):", orderId);

        const orderInfo: OrderData = {
          id: culqiOrder.id,
          order_number: culqiOrder.order_number,
          description: culqiOrder.description,
          amount: culqiOrder.amount,
          currency: culqiOrder.currency || culqiOrder.currency_code || 'PEN',
          state: culqiOrder.state,
          customer: {
            email: payment?.customerId?.email || culqiOrder.customer?.email || "",
            name: payment?.customerId?.name || culqiOrder.customer?.name || "",
          },
        };

        setOrderData(orderInfo);
        setLoading(false);
        if (payment?.checkoutUrl) setCheckoutUrl(payment.checkoutUrl);
      }
    } catch (err: any) {
      console.error("Error al cargar orden:", err);
      setError(err.response?.data?.message || "Error al cargar la orden");
      setLoading(false);
    }
  };

  const openCulqiCheckout = () => {
    const currentOrder = orderRef.current;
    
    const isValidCulqiUrl = checkoutUrl && (
      checkoutUrl.includes('culqi.com') || 
      checkoutUrl.includes('checkout.culqi')
    );
    
    // Si hay URL de Culqi hosted checkout, abrirlo
    if (isValidCulqiUrl) {
      console.log("✅ Abriendo Culqi hosted checkout:", checkoutUrl);
      window.open(checkoutUrl, '_blank');
      startPaymentPolling();
      return;
    }

    // Usar Culqi SDK
    if (currentOrder && window.Culqi && culqiOrderId) {
      try {
        console.log("✅ Abriendo Culqi SDK para orden:", culqiOrderId);
        
        window.Culqi.settings({
          title: "Pago Seguro",
          currency: currentOrder.currency,
          amount: currentOrder.amount,
          order: culqiOrderId, // ✅ CRÍTICO: Usar el culqiOrderId, no el order._id
        });

        window.Culqi.options({
          lang: 'es',
          modal: true,
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: true,
            billetera: false,
            bancaMovil: false,
            agente: false,
            cuotealo: false,
          },
        });

        window.Culqi.open();
        return;
      } catch (err) {
        console.error("❌ Error al abrir Culqi SDK:", err);
        setError("Error al iniciar el proceso de pago");
        return;
      }
    }

    console.error("❌ No hay método de pago disponible");
    setError("Sistema de pago no disponible");
  };

  // ✅ Callback Culqi - Solo para logging y verificación
  useEffect(() => {
    window.culqi = async function () {
      if (processingPaymentRef.current) {
        console.warn("⚠️ Ya hay un pago en proceso");
        return;
      }

      const currentOrder = orderRef.current;
      if (!currentOrder || !culqiOrderId) {
        console.error("⚠️ No hay orden activa");
        return;
      }

      if (window.Culqi.token) {
        const tokenId = window.Culqi.token.id;
        console.log("✅ Token recibido:", tokenId);
        console.log("⏳ Culqi está procesando el pago automáticamente...");
        
        processingPaymentRef.current = true;
        setProcessing(true);
        
        // ✅ ESPERAR 4 segundos para que Culqi procese el pago
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // ✅ Ahora verificar el estado
        await verifyPaymentWithRetry();
        
      } else if (window.Culqi.error) {
        console.error("❌ Error de Culqi:", window.Culqi.error);
        setError(window.Culqi.error.user_message || "Error en el proceso de pago");
        setProcessing(false);
        processingPaymentRef.current = false;
      }
    };
  }, [culqiOrderId, navigate]);

  // ✅ Nueva función: Verificar pago con reintentos
  const verifyPaymentWithRetry = async (maxRetries = 5) => {
    if (!culqiOrderId) {
      setError("No se pudo identificar la orden de pago");
      setProcessing(false);
      processingPaymentRef.current = false;
      return;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔍 Verificando pago... intento ${attempt}/${maxRetries}`);
      
      try {
        const response = await api.post('/api/culqi/verify-payment', {
          culqiOrderId: culqiOrderId,
        });

        console.log("📊 Estado del pago:", response.data);

        if (response.data.success) {
          // ✅ PAGO EXITOSO
          console.log("✅ Pago completado exitosamente");
          const dbOrderId = response.data.orderId || response.data.order?._id;
          
          if (dbOrderId) {
            navigate(`/success?order=${dbOrderId}`);
          } else {
            navigate('/success');
          }
          return;
        } else if (response.data.pending) {
          // ⏳ AÚN PENDIENTE
          if (attempt < maxRetries) {
            console.log(`⏳ Pago pendiente, esperando 2 segundos antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue; // Reintentar
          } else {
            // Último intento, iniciar polling largo
            console.log("⏳ Pago sigue pendiente después de reintentos, iniciando polling...");
            setProcessing(false);
            startPaymentPolling();
            return;
          }
        } else if (response.data.orderExpired) {
          // ⌛ ORDEN EXPIRADA
          setError(
            "Esta orden de pago ha expirado. " +
            "Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago."
          );
          setTimeout(() => navigate('/my-orders'), 5000);
          setProcessing(false);
          processingPaymentRef.current = false;
          return;
        } else {
          // ❌ OTRO ERROR
          setError(response.data.message || "Error al procesar el pago");
          setProcessing(false);
          processingPaymentRef.current = false;
          return;
        }
      } catch (err: any) {
        console.error(`❌ Error en intento ${attempt}:`, err);
        
        if (err.response?.status === 400 && err.response?.data?.orderExpired) {
          setError(
            "Esta orden de pago ha expirado. " +
            "Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago."
          );
          setTimeout(() => navigate('/my-orders'), 5000);
          setProcessing(false);
          processingPaymentRef.current = false;
          return;
        }
        
        if (attempt === maxRetries) {
          setError(err.response?.data?.message || "Error al verificar el pago");
          setProcessing(false);
          processingPaymentRef.current = false;
          return;
        }
        
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const startPaymentPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setCheckingPayment(true);
    console.log("🔄 Iniciando verificación de pago...");

    let attempts = 0;
    const maxAttempts = 120; // 2 minutos

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      console.log(`🔍 Verificando pago... intento ${attempts}/${maxAttempts}`);

      try {
        if (!culqiOrderId) {
          console.error("No hay culqiOrderId para verificar");
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          setError("No se pudo obtener el ID de pago de Culqi");
          return;
        }

        const response = await api.post('/api/culqi/verify-payment', {
          culqiOrderId: culqiOrderId,
        });

        if (response.data.orderExpired) {
          console.warn("⚠️ La orden de pago ha expirado");
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          setError(
            "Esta orden de pago ha expirado. " +
            "Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago."
          );
          setTimeout(() => navigate('/my-orders'), 5000);
          return;
        }

        if (response.data.success && response.data.payment?.status === "completed") {
          console.log("✅ Pago confirmado!");
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          
          const dbOrderId = response.data.order?._id || response.data.payment?.orderId;
          if (dbOrderId) {
            navigate(`/success?order=${dbOrderId}`);
          } else {
            navigate(`/success`);
          }
        } else if (attempts >= maxAttempts) {
          console.log("⏱️ Timeout alcanzado");
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          setError("El pago está tomando más tiempo del esperado. Puedes verificar el estado en 'Mis Pedidos'.");
        }
      } catch (err) {
        console.error("Error al verificar pago:", err);
        if (attempts >= maxAttempts) {
          clearInterval(pollingIntervalRef.current!);
          setCheckingPayment(false);
          setError("No se pudo verificar el estado del pago. Por favor, revisa 'Mis Pedidos'.");
        }
      }
    }, 1000);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-5">
        {(loading || processing || checkingPayment) && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 text-center max-w-sm">
              <div className="inline-block w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-800 font-semibold text-lg">
                {loading ? 'Cargando orden...' : (checkingPayment ? 'Verificando pago...' : 'Procesando pago...')}
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
            disabled={processing || checkingPayment || !culqiOrderId}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            💳 Pagar Ahora
          </button>

          {checkoutUrl && checkoutUrl.includes('culqi') && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-center mt-3 text-sm text-indigo-700 underline"
            >
              Abrir checkout en nueva pestaña
            </a>
          )}

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
    </>
  );
}