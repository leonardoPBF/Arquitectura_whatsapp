import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { culqiAPI } from '../services/api';
import api from '../services/api';
import { authenticate3DS, loadCulqi3DS } from '@/lib/culqi-3ds';
import { Navbar } from '@/components/Navbar';
import { culqiRsaSettings, isCulqiCheckoutUrl } from '../lib/culqi-config';

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
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [awaitingSettlement, setAwaitingSettlement] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);
  const [retryAuthentication, setRetryAuthentication] = useState(false);
  const authenticationRef = useRef<AbortController | null>(null);
  const continuationRef = useRef<{ tokenId: string; deviceId: string; attemptId: string } | null>(null);
  const [culqiOrderId, setCulqiOrderId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRef = useRef<OrderData | null>(null);
  const processingPaymentRef = useRef(false);
  const callbackExecutedRef = useRef(false);
  const isPollingActiveRef = useRef(false);

  useEffect(() => {
    loadOrderData();
    
    return () => {
      authenticationRef.current?.abort();
      // Limpiar polling al desmontar o cambiar orderId
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingActiveRef.current = false;
      processingPaymentRef.current = false;
      callbackExecutedRef.current = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (orderData) {
      orderRef.current = orderData;
    }
  }, [orderData]);

  // Cargar SDK Culqi
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.culqi.com/js/v4';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.Culqi) {
        window.Culqi.publicKey = CULQI_PUBLIC_KEY;
        console.log('✅ Culqi SDK cargado');
      }
    };
    script.onerror = () => setError('No se pudo cargar Culqi. Reintenta el pago.');

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const loadOrderData = async () => {
    if (!orderId) {
      setError('No se proporcionó ID de orden');
      setLoading(false);
      return;
    }

    try {
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(orderId);

      if (isObjectId) {
        // Es un ID de MongoDB
        const res = await api.get(`/api/orders/${orderId}`);
        const order = res.data;

        if (order.status === 'cancelled' || order.paymentStatus === 'refunded') {
          setError('Este pedido no admite pagos.');
          setLoading(false);
          return;
        }
        if (order.paymentStatus === 'paid') {
          navigate(`/success?order=${order._id}`);
          return;
        }

        // Buscar el payment asociado para obtener el culqiOrderId
        const paymentRes = await api.get(`/api/payments?orderId=${order._id}`);
        const payment = paymentRes.data?.[0];
        setPaymentMethod(payment?.method || 'card');
        setNeedsRestart(payment?.status === 'requires_action');
        setAwaitingSettlement(['processing', 'review'].includes(payment?.status));
        setPaymentBlocked(['processing', 'review', 'requires_action'].includes(payment?.status));

        if (payment?.culqiOrderId) {
          setCulqiOrderId(payment.culqiOrderId);
          console.log('✅ culqiOrderId encontrado:', payment.culqiOrderId);
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
            email: order.customerId?.email || '',
            name: order.customerId?.name || '',
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

        if (payment?.status === 'completed') {
          const dbOrderId = payment?.orderId?._id || payment?.orderId || null;
          if (dbOrderId) navigate(`/success?order=${dbOrderId}`);
          else navigate('/success');
          return;
        }

        setPaymentMethod(payment?.method || 'card');
        setNeedsRestart(payment?.status === 'requires_action');
        setAwaitingSettlement(['processing', 'review'].includes(payment?.status));
        setPaymentBlocked(['processing', 'review', 'requires_action'].includes(payment?.status));
        setCulqiOrderId(orderId);
        console.log('✅ culqiOrderId (desde URL):', orderId);

        const orderInfo: OrderData = {
          id: payment?.orderId?._id || payment?.orderId,
          order_number: culqiOrder.order_number,
          description: culqiOrder.description,
          amount: culqiOrder.amount,
          currency: culqiOrder.currency || culqiOrder.currency_code || 'PEN',
          state: culqiOrder.state,
          customer: {
            email: payment?.customerId?.email || culqiOrder.customer?.email || '',
            name: payment?.customerId?.name || culqiOrder.customer?.name || '',
          },
        };

        setOrderData(orderInfo);
        setLoading(false);
        if (payment?.checkoutUrl) setCheckoutUrl(payment.checkoutUrl);
      }
    } catch (err: any) {
      console.error('Error al cargar orden:', err);
      setError(err.response?.data?.message || 'Error al cargar la orden');
      setLoading(false);
    }
  };

  const openCulqiCheckout = () => {
    const currentOrder = orderRef.current;
    if (paymentBlocked) return;
    const isValidCulqiUrl = isCulqiCheckoutUrl(checkoutUrl);
    
    // Si hay URL de Culqi hosted checkout, abrirlo
    if (paymentMethod !== 'card' && isValidCulqiUrl) {
      console.log('✅ Abriendo Culqi hosted checkout:', checkoutUrl);
      window.open(checkoutUrl!, '_blank', 'noopener,noreferrer');
      startPaymentPolling();
      return;
    }

    // Usar Culqi SDK
    if (currentOrder && window.Culqi && (paymentMethod === 'card' || culqiOrderId)) {
      try {
        console.log('✅ Abriendo Culqi SDK para orden:', culqiOrderId);
        
        window.Culqi.settings({
          ...culqiRsaSettings(import.meta.env),
          title: 'Pago Seguro',
          currency: currentOrder.currency,
          amount: currentOrder.amount,
          order: paymentMethod === 'card' ? '' : culqiOrderId,
        });

        window.Culqi.options({
          lang: 'es',
          modal: true,
          installments: false,
          style: { bannerColor: '#203e34', buttonBackground: '#305941', buttonTextColor: '#ffffff', linksColor: '#305941', priceColor: '#305941' },
          paymentMethods: {
            tarjeta: paymentMethod === 'card',
            yape: paymentMethod === 'card',
            billetera: paymentMethod === 'billetera_movil',
            bancaMovil: paymentMethod === 'pagoefectivo',
            agente: paymentMethod === 'pagoefectivo',
            cuotealo: false,
          },
        });

        setError('');
        window.Culqi.open();
        return;
      } catch (err) {
        console.error('❌ Error al abrir Culqi SDK:', err);
        setError('Error al iniciar el proceso de pago');
        return;
      }
    }

    console.error('❌ No hay método de pago disponible');
    setError('Sistema de pago no disponible');
  };

  const startPaymentPolling = useCallback(() => {
    // Prevenir múltiples instancias de polling
    if (isPollingActiveRef.current) {
      console.warn('⚠️ Polling ya está activo, ignorando...');
      return;
    }

    // Limpiar cualquier polling anterior
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    isPollingActiveRef.current = true;
    setCheckingPayment(true);
    console.log('🔄 Iniciando verificación de pago...');

    let attempts = 0;
    const maxAttempts = 24; // 2 minutos

    pollingIntervalRef.current = setTimeout(async function poll() {
      attempts++;
      console.log(`🔍 Verificando pago... intento ${attempts}/${maxAttempts}`);

      try {
        if (!orderRef.current?.id && !culqiOrderId) {
          console.error('No hay culqiOrderId para verificar');
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          setCheckingPayment(false);
          setError('No se pudo obtener el ID de pago de Culqi');
          return;
        }

        const response = await api.post('/api/culqi/verify-payment', {
          ...(paymentMethod === 'card' ? { orderId: orderRef.current?.id } : { culqiOrderId }),
        });

        if (response.data.requiresAction) {
          isPollingActiveRef.current = false;
          setAwaitingSettlement(false);
          setCheckingPayment(false);
          setPaymentBlocked(true);
          setError('El banco requiere autenticación. Retoma el intento original de pago; verificar el estado no completa el Challenge.');
          return;
        }
        if (response.data.payment?.status === 'failed') {
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          processingPaymentRef.current = false;
          callbackExecutedRef.current = false;
          setCheckingPayment(false);
          setPaymentBlocked(false);
          setError('La tarjeta fue rechazada. Puedes intentar con otra tarjeta.');
          return;
        }

        // Si ya está pagado, evitar procesamiento duplicado
        if (response.data.alreadyPaid) {
          console.log('✅ Pago ya procesado anteriormente');
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          setCheckingPayment(false);
          const dbOrderId = response.data.orderId || response.data.order?._id;
          if (dbOrderId) {
            navigate(`/success?order=${dbOrderId}`);
          } else {
            navigate('/success');
          }
          return;
        }

        if (response.data.orderExpired) {
          console.warn('⚠️ La orden de pago ha expirado');
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          setCheckingPayment(false);
          setError(
            'Esta orden de pago ha expirado. ' +
            'Por favor, regresa a \'Mis Pedidos\' y genera un nuevo enlace de pago.'
          );
          setTimeout(() => navigate('/my-orders'), 5000);
          return;
        }

        if (response.data.success && response.data.payment?.status === 'completed') {
          console.log('✅ Pago confirmado!');
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          setCheckingPayment(false);
          
          // Resetear flags
          processingPaymentRef.current = false;
          callbackExecutedRef.current = false;
          
          const dbOrderId = response.data.order?._id || response.data.payment?.orderId || response.data.orderId;
          if (dbOrderId) {
            navigate(`/success?order=${dbOrderId}`);
          } else {
            navigate('/success');
          }
        } else if (attempts >= maxAttempts) {
          console.log('⏱️ Timeout alcanzado');
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          setCheckingPayment(false);
          setError('El pago está tomando más tiempo del esperado. Puedes verificar el estado en \'Mis Pedidos\'.');
        }
      } catch (err) {
        console.error('Error al verificar pago:', err);
        if (attempts >= maxAttempts) {
          clearTimeout(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          isPollingActiveRef.current = false;
          setCheckingPayment(false);
          setError('No se pudo verificar el estado del pago. Por favor, revisa \'Mis Pedidos\'.');
        }
      } finally {
        if (isPollingActiveRef.current && attempts < maxAttempts) pollingIntervalRef.current = setTimeout(poll, 5000);
      }
    }, 5000);
  }, [culqiOrderId, navigate, paymentMethod]);



  // ✅ Callback Culqi - Procesa el pago directamente con create-charge
  const handleCulqiCallback = useCallback(async () => {
    // Prevenir múltiples ejecuciones
    if (callbackExecutedRef.current) {
      console.warn('⚠️ Callback ya ejecutado, ignorando...');
      return;
    }

    if (processingPaymentRef.current) {
      console.warn('⚠️ Ya hay un pago en proceso');
      return;
    }

    const currentOrder = orderRef.current;
    if (!currentOrder?.id) {
      console.error('⚠️ No hay orden activa');
      return;
    }

    if (window.Culqi?.token || continuationRef.current) {
      const tokenId = continuationRef.current?.tokenId || window.Culqi.token.id;
      console.log('💳 Procesando pago directamente con create-charge...');
      
      callbackExecutedRef.current = true;
      processingPaymentRef.current = true;
      setProcessing(true);
      
      try {
        // ✅ Crear cargo directo con el token
        window.Culqi?.close();
        const client = await loadCulqi3DS(CULQI_PUBLIC_KEY);
        const previous = continuationRef.current;
        const deviceId = previous?.deviceId || await client.generateDevice();
        if (!deviceId) throw new Error('No se pudo identificar el dispositivo. Reintenta antes de pagar.');
        let response;
        if (previous) {
          response = { data: { requiresAction: true, attemptId: previous.attemptId, success: false } };
        } else {
          response = await culqiAPI.createCharge({ tokenId, deviceId, orderId: currentOrder.id });
        }
        if (response.data.requiresAction && response.data.attemptId) {
          const originalToken = previous?.tokenId || tokenId;
          continuationRef.current = { tokenId: originalToken, deviceId, attemptId: response.data.attemptId };
          setAuthenticating(true); setProcessing(false); setRetryAuthentication(false); setPaymentBlocked(true);
          const controller = new AbortController(); authenticationRef.current = controller;
          const parameters = await authenticate3DS(client, originalToken, currentOrder.amount, currentOrder.customer.email, controller.signal);
          setAuthenticating(false); setProcessing(true);
          const attemptId = continuationRef.current.attemptId;
          continuationRef.current = null;
          response = await culqiAPI.createCharge({ tokenId: originalToken, deviceId, attemptId, authentication3DS: parameters, orderId: currentOrder.id });
        }
        client.reset();


        if (response.data.pending) {
          setAwaitingSettlement(true);
          setPaymentBlocked(true);
          setProcessing(false);
          window.Culqi?.close();
          setError('Estamos verificando el pago. No vuelvas a pagar.');
          startPaymentPolling();
          return;
        }
        // Si ya está pagado, evitar procesamiento duplicado
        if (response.data.alreadyPaid) {
          console.log('✅ Pago ya procesado anteriormente');
          const dbOrderId = response.data.orderId || response.data.order?._id;
          processingPaymentRef.current = false;
          callbackExecutedRef.current = false;
          
          // ✅ Cerrar modal de Culqi
          if (window.Culqi?.close) {
            window.Culqi.close();
            console.log('🔒 Modal de Culqi cerrado');
          }
          
          // Pequeño delay para asegurar que el modal se cierre antes de navegar
          setTimeout(() => {
            if (dbOrderId) {
              navigate(`/success?order=${dbOrderId}`);
            } else {
              navigate('/success');
            }
          }, 300);
          return;
        }

        if (response.data.success) {
          // ✅ PAGO EXITOSO
          console.log('✅ Pago completado exitosamente');
          const dbOrderId = response.data.orderId || response.data.order?._id;
          
          // Resetear flags antes de navegar
          processingPaymentRef.current = false;
          callbackExecutedRef.current = false;
          
          // ✅ Cerrar modal de Culqi
          if (window.Culqi?.close) {
            window.Culqi.close();
            console.log('🔒 Modal de Culqi cerrado');
          }
          
          // Pequeño delay para asegurar que el modal se cierre antes de navegar
          setTimeout(() => {
            if (dbOrderId) {
              navigate(`/success?order=${dbOrderId}`);
            } else {
              navigate('/success');
            }
          }, 300);
        } else {
          // ❌ PAGO RECHAZADO
          console.error('❌ Pago rechazado:', response.data.message);
          setError(response.data.message || 'El pago fue rechazado. Por favor, intenta con otro método de pago.');
          setProcessing(false);
          processingPaymentRef.current = false;
          callbackExecutedRef.current = false;
        }
      } catch (err: any) {
        setAuthenticating(false);
        if (continuationRef.current) {
          setRetryAuthentication(true); setProcessing(false);
          processingPaymentRef.current = false; callbackExecutedRef.current = false;
          setError(err.message || 'Completa la autenticación bancaria.');
          return;
        }
        console.error('❌ Error al procesar pago:', err);
        setError(err.response?.data?.message || 'No se recibió el resultado. Verificaremos el pago antes de permitir otro intento.');
        if ((!err.response && processingPaymentRef.current && err.isAxiosError) || err.response?.data?.pending) {
          setAwaitingSettlement(true);
          setPaymentBlocked(true);
          window.Culqi?.close();
          startPaymentPolling();
        }
        if (err.response && !err.response.data?.pending) setPaymentBlocked(false);
        setProcessing(false);
        processingPaymentRef.current = false;
        callbackExecutedRef.current = false;
      }
      
    } else if (window.Culqi?.error) {
      console.error('❌ Error de Culqi:', window.Culqi.error);
      setError(window.Culqi.error.user_message || 'Error en el proceso de pago');
      setProcessing(false);
      processingPaymentRef.current = false;
      callbackExecutedRef.current = false;
    }
  }, [navigate, startPaymentPolling]);

  // Configurar callback de Culqi solo una vez cuando culqiOrderId está disponible
  useEffect(() => {
    if (!orderData?.id) return;

    // Resetear flag cuando cambia el culqiOrderId
    callbackExecutedRef.current = false;
    processingPaymentRef.current = false;

    // Configurar callback
    window.culqi = handleCulqiCallback;

    return () => {
      // Limpiar callback al desmontar o cambiar culqiOrderId
      if (window.culqi === handleCulqiCallback) {
        window.culqi = () => {};
      }
    };
  }, [orderData?.id, handleCulqiCallback]);

  useEffect(() => {
    if (awaitingSettlement && orderData?.id) startPaymentPolling();
  }, [awaitingSettlement, orderData?.id, startPaymentPolling]);

  return (
    <>
      <Navbar />
      {authenticating && <div role="status" className="fixed bottom-4 left-4 right-4 z-40 rounded-xl border border-border bg-card p-4 text-center text-foreground">Completa la autenticación en la ventana de tu banco. Todavía no se ha confirmado el pago.</div>}
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        {(loading || processing || checkingPayment) && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-card rounded-xl p-8 text-center max-w-sm">
              <div className="inline-block w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-foreground font-semibold text-lg">
                {loading ? 'Cargando orden...' : (checkingPayment ? 'Verificando pago...' : 'Procesando pago...')}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                No cierres esta ventana
              </p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full p-10">
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center text-4xl mb-6">
            🛍️
          </div>
          
          <h1 className="text-3xl font-bold text-foreground text-center mb-2">
            Completar Pago
          </h1>
          <p className="text-muted-foreground text-center mb-8">Pago seguro con Culqi</p>

          <div className="bg-muted rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted-foreground">Orden:</span>
              <span className="text-foreground font-semibold">{orderData?.order_number}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted-foreground">Descripción:</span>
              <span className="text-foreground font-semibold">{orderData?.description}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-border mt-2">
              <span className="text-muted-foreground font-bold text-lg">Total a pagar:</span>
              <span className="text-foreground font-bold text-xl">
                S/ {((orderData?.amount || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {needsRestart && <button className="w-full rounded-xl border border-border p-4 mb-4" onClick={async () => {
            setProcessing(true);
            try { await api.post('/api/culqi/cancel-authentication', { orderId }); setNeedsRestart(false); setPaymentBlocked(false); setError('Autenticación anterior cancelada. Puedes iniciar un nuevo intento.'); }
            catch { setError('El pago cambió de estado. Revisa Mis Pedidos antes de reintentar.'); }
            finally { setProcessing(false); }
          }}>Reiniciar autenticación pendiente</button>}
          {retryAuthentication && <button className="w-full rounded-xl bg-primary text-primary-foreground p-4 mb-4" onClick={() => handleCulqiCallback()}>Reintentar autenticación bancaria</button>}
          <button
            onClick={openCulqiCheckout}
            disabled={processing || checkingPayment || paymentBlocked || !orderData || (paymentMethod !== 'card' && !culqiOrderId)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            💳 Pagar Ahora
          </button>

          {paymentMethod !== 'card' && isCulqiCheckoutUrl(checkoutUrl) && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-center mt-3 text-sm text-indigo-700 underline"
            >
              Abrir checkout en nueva pestaña
            </a>
          )}

          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-6">
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
