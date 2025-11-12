import { Request, Response } from "express";
import Culqi from "culqi-node";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { Conversation } from "../models/Conversation";
import dotenv from "dotenv";
import { Customer } from "../models/Customer";

dotenv.config();

const culqi = new Culqi({
  privateKey: process.env.CULQI_PRIVATE_KEY!,
  publicKey: process.env.CULQI_PUBLIC_KEY!,
  pciCompliant: true,
});

/**
 * ============================================
 * POST /api/culqi/create-order
 * Crea una orden y genera un link de pago Culqi
 * ============================================
 */
export const createCulqiOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, currency = "PEN", method } = req.body;

    if (!orderId || !method)
      return res.status(400).json({ message: "orderId y method son requeridos" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    const user = await Customer.findById(order.customerId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Si ya existe un Payment para esta orden y gateway culqi, reutilizarlo
    let payment = await Payment.findOne({ orderId: order._id, gateway: "culqi" });
    if (payment && payment.checkoutUrl) {
      return res.status(200).json({
        success: true,
        message: "Payment existente encontrado",
        checkoutUrl: payment.checkoutUrl,
        culqiOrder: { id: payment.culqiOrderId },
        payment,
      });
    }

    // ✅ Mapear método de pago a payment_methods de Culqi
    // Culqi acepta: card, billetera_movil, pagoefectivo
    const paymentMethodsMap: Record<string, string[]> = {
      card: ["card"],
      billetera_movil: ["billetera_movil"],
      pagoefectivo: ["pagoefectivo"],
      // Si se quiere permitir múltiples métodos, se puede especificar
      all: ["card", "billetera_movil", "pagoefectivo"],
    };

    const paymentMethods = paymentMethodsMap[method] || ["card"]; // Default a card si no se reconoce

    // 1️⃣ Crear la orden en Culqi
    const culqiOrder = await culqi.orders.createOrder({
      amount: Math.round(order.totalAmount * 100), // Monto en centavos
      currency_code: currency,
      description: `Orden #${order.orderNumber}`,
      order_number: order.orderNumber,
      client_details: {
        first_name: user.name.split(' ')[0] || user.name,
        last_name: user.name.split(' ').slice(1).join(' ') || "Cliente",
        email: String(user.email || "cliente@example.com"),
        phone_number: user.phone || "+51999999999",
      },
      expiration_date: Math.floor(Date.now() / 1000) + 86400, // 24 horas
      // ✅ Agregar métodos de pago permitidos
      // @ts-ignore - La librería culqi-node podría no tener los tipos actualizados
      payment_methods: paymentMethods,
    });

    console.log("✅ Orden Culqi creada:", culqiOrder.id);

    // Generar checkout URL local
    const checkoutUrl = `${process.env.LOCAL_LINK}?order=${culqiOrder.id}`;

    payment = await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      amount: order.totalAmount,
      gateway: "culqi",
      culqiOrderId: culqiOrder.id,
      checkoutUrl,
      method,
      status: "pending",
      gatewayResponse: culqiOrder,
    });

    res.status(201).json({
      success: true,
      message: "Orden y link de pago creados correctamente",
      checkoutUrl,
      culqiOrder,
      payment,
    });
  } catch (error: any) {
    console.error("❌ Error al crear orden Culqi:", error.response?.data || error);
    res.status(500).json({
      message: "Error al crear orden en Culqi",
      error: error.response?.data || error.message,
      details: error.response?.data || null,
    });
  }
};

/**
 * ============================================
 * POST /api/culqi/create-charge
 * DEPRECATED: No usar, causa duplicidad
 * Usar el flujo de Culqi checkout directo
 * ============================================
 */
/**
/**
 * ============================================
 * POST /api/culqi/verify-payment
 * Verifica el estado de un pago de Culqi (sin intentar confirmarlo)
 * ============================================
 */
export const verifyCulqiPayment = async (req: Request, res: Response) => {
  try {
    const { culqiOrderId } = req.body;

    if (!culqiOrderId) {
      return res.status(400).json({ 
        success: false,
        message: "culqiOrderId es requerido" 
      });
    }
     
    const payment = await Payment.findOne({ culqiOrderId }).populate("orderId");

    if (!payment || !payment.orderId) {
      return res.status(404).json({ 
        success: false,
        message: "No se encontró la orden asociada al culqiOrderId" 
      });
    }

    // ✅ PREVENIR DUPLICADOS: Si ya está completado, no procesar de nuevo
    if (payment.status === "completed") {
      console.warn(`⚠️ Payment ${payment._id} ya está completado`);
      const order = payment.orderId as any;
      return res.json({ 
        success: true, 
        message: "Este pago ya fue procesado anteriormente",
        payment, 
        order,
        paymentId: payment._id, 
        orderId: order._id,
        alreadyPaid: true
      });
    }

    const order = payment.orderId as any;

    console.log(`🔍 Verificando estado de orden Culqi ${culqiOrderId} para orden ${order.orderNumber}`);

    // ✅ CONSULTAR el estado actual de la orden en Culqi (NO CONFIRMAR)
    let culqiOrder: any;
    try {
      culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
      console.log(`📊 Estado actual de orden Culqi: ${culqiOrder.state}`);
    } catch (getOrderError: any) {
      // Si no se puede obtener la orden, puede que haya expirado
      if (getOrderError.type === 'parameter_error' || getOrderError.merchant_message?.includes('No existe')) {
        console.warn(`⚠️ Orden Culqi ${culqiOrderId} no existe o expiró`);
        
        payment.status = 'expired';
        payment.gatewayResponse = { 
          ...payment.gatewayResponse,
          error: getOrderError,
          expired_at: new Date()
        };
        await payment.save();
        
        return res.status(400).json({
          success: false,
          message: "La orden de pago ha expirado. Por favor, genera un nuevo enlace de pago.",
          orderExpired: true,
          error: getOrderError.merchant_message,
          paymentId: payment._id,
          orderId: order._id
        });
      }
      
      throw getOrderError;
    }

    // ✅ Procesar según el estado de Culqi
    switch (culqiOrder.state) {
      case "paid":
        // ✅ PAGO EXITOSO
        order.status = "confirmed";
        order.paymentStatus = "paid";
        await order.save();

        payment.status = "completed";
        payment.transactionId = culqiOrder.id;
        payment.gatewayResponse = culqiOrder;
        await payment.save();

        console.log(`✅ Pago completado para orden ${order.orderNumber}`);

        return res.json({ 
          success: true, 
          message: "Pago confirmado exitosamente",
          culqiOrder, 
          order, 
          payment, 
          paymentId: payment._id, 
          orderId: order._id 
        });

      case "pending":
        // ⏳ PAGO EN PROCESO
        console.log(`⏳ Pago aún en proceso para orden ${order.orderNumber}`);
        
        payment.gatewayResponse = culqiOrder;
        await payment.save();

        return res.json({
          success: false,
          message: "El pago está siendo procesado. Por favor, espera unos momentos.",
          pending: true,
          culqiState: culqiOrder.state,
          payment,
          paymentId: payment._id,
          orderId: order._id
        });

      case "expired":
        // ⌛ ORDEN EXPIRADA
        console.warn(`⌛ Orden ${culqiOrderId} expiró`);
        
        payment.status = "expired";
        payment.gatewayResponse = culqiOrder;
        await payment.save();

        return res.status(400).json({
          success: false,
          message: "La orden de pago ha expirado. Por favor, genera un nuevo enlace de pago.",
          orderExpired: true,
          culqiState: culqiOrder.state,
          paymentId: payment._id,
          orderId: order._id
        });

      case "rejected":
        // ❌ PAGO RECHAZADO
        console.warn(`❌ Pago rechazado para orden ${order.orderNumber}`);
        
        payment.status = "failed";
        payment.gatewayResponse = culqiOrder;
        await payment.save();

        return res.status(400).json({
          success: false,
          message: "El pago fue rechazado. Por favor, intenta con otro método de pago.",
          rejected: true,
          culqiState: culqiOrder.state,
          paymentId: payment._id,
          orderId: order._id
        });

      case "created":
        // 📝 ORDEN CREADA PERO SIN PAGO
        console.log(`📝 Orden creada pero sin pago iniciado: ${order.orderNumber}`);
        
        return res.json({
          success: false,
          message: "La orden está creada pero el pago no ha sido iniciado.",
          pending: true,
          culqiState: culqiOrder.state,
          payment,
          paymentId: payment._id,
          orderId: order._id
        });

      default:
        // ❓ ESTADO DESCONOCIDO
        console.warn(`❓ Estado desconocido: ${culqiOrder.state}`);
        
        return res.json({
          success: false,
          message: `Estado del pago: ${culqiOrder.state}`,
          culqiState: culqiOrder.state,
          payment,
          paymentId: payment._id,
          orderId: order._id
        });
    }

  } catch (error: any) {
    console.error("❌ Error al verificar pago:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al verificar pago", 
      error: error.message || error.merchant_message
    });
  }
};

/**
 * ============================================
 * POST /api/culqi/confirm-order
 * Confirma el estado de una orden de Culqi
 * ============================================
 */
export const confirmCulqiOrder = async (req: Request, res: Response) => {
  try {
    const { culqiOrderId } = req.body;
    if (!culqiOrderId) return res.status(400).json({ 
      success: false,
      message: "culqiOrderId es requerido" 
    });

    console.log(`🔍 Confirmando orden: ${culqiOrderId}`);

    const payment = await Payment.findOne({ culqiOrderId }).populate("orderId");
    if (!payment) {
      console.warn(`Payment no encontrado para culqiOrderId: ${culqiOrderId}`);
      return res.status(404).json({ 
        success: false,
        message: "Pago no encontrado" 
      });
    }

    // Obtener estado actual de Culqi con manejo de errores
    let culqiOrder: any = null;
    let orderExpired = false;

    try {
      culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
      console.log(`Estado de orden Culqi: ${culqiOrder.state}`);
    } catch (culqiError: any) {
      console.error(`❌ Error consultando Culqi: ${culqiError.merchant_message || culqiError.message}`);
      
      // Si la orden no existe o expiró
      if (culqiError.type === 'parameter_error' || culqiError.merchant_message?.includes('No existe')) {
        orderExpired = true;
        
        // Marcar como expirado
        if (payment.status === 'pending') {
          payment.status = 'expired';
          payment.gatewayResponse = { 
            ...payment.gatewayResponse,
            error: culqiError,
            expired_at: new Date()
          };
          await payment.save();
          console.log(`⚠️ Payment ${payment._id} marcado como expired`);
        }
        
        return res.json({
          success: false,
          message: "La orden de pago ha expirado en Culqi",
          orderExpired: true,
          payment,
        });
      }
      
      throw culqiError;
    }

    const isPaid = culqiOrder.state === "paid";

    if (isPaid) {
      payment.status = "completed";
      payment.gatewayResponse = culqiOrder;
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = "confirmed";
        order.paymentStatus = "paid";
        await order.save();
        console.log(`✅ Orden ${order.orderNumber} confirmada como pagada`);
      }

      return res.json({
        success: true,
        message: "Pago confirmado",
        payment,
        order,
      });
    }

    res.json({
      success: false,
      message: "Pago aún pendiente",
      status: payment.status,
      culqiState: culqiOrder.state,
      payment,
    });
  } catch (error: any) {
    console.error("❌ Error al confirmar orden:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al confirmar orden", 
      error: error.message || error.merchant_message 
    });
  }
};

/**
 * ============================================
 * POST /api/culqi/webhook
 * Webhook oficial de Culqi
 * ============================================
 */
export const handleCulqiWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    if (!event.type || !event.data)
      return res.status(400).json({ message: "Evento inválido" });

    console.log("📦 Webhook Culqi recibido:", event.type);

    switch (event.type) {
      case "order.status.changed":
        await handleOrderStatusChanged(event.data);
        break;
      case "charge.succeeded":
        await handleChargeSucceeded(event.data);
        break;
      case "charge.failed":
        await handleChargeFailed(event.data);
        break;
      case "refund.created":
        await handleRefundCreated(event.data);
        break;
      default:
        console.log("Tipo de evento no manejado:", event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("❌ Error en webhook:", error);
    res.status(500).json({ message: "Error al procesar webhook", error: error.message });
  }
};

/**
 * ============================================
 * GET /api/culqi/order/:paymentId
 * Consulta el estado de una orden Culqi usando el ID del pago
 * ============================================
 */
export const getCulqiOrderStatus = async (req: Request, res: Response) => {
  try {
    const { culqiOrderId, paymentId } = req.params;

    // Buscar el pago preferentemente por culqiOrderId (ruta /order/:culqiOrderId)
    let payment: any = null;
    if (culqiOrderId) {
      payment = await Payment.findOne({ culqiOrderId }).populate("orderId").populate("customerId");
    } else if (paymentId) {
      payment = await Payment.findById(paymentId).populate("orderId").populate("customerId");
    }

    if (!payment) {
      console.warn(`Pago no encontrado para params: ${JSON.stringify(req.params)}`);
      return res.status(404).json({ 
        success: false,
        message: "Pago no encontrado" 
      });
    }

    // Obtener el estado actual desde Culqi (usar culqiOrderId del payment si no vino en la ruta)
    const culqiIdToQuery = culqiOrderId || payment.culqiOrderId;
    if (!culqiIdToQuery) {
      console.warn("El payment no tiene culqiOrderId asociado:", payment);
      return res.status(400).json({ 
        success: false,
        message: "El pago no tiene un culqiOrderId asociado" 
      });
    }

    // Intentar obtener la orden de Culqi con manejo de errores mejorado
    let culqiOrder: any = null;
    let orderExpired = false;

    try {
      culqiOrder = await culqi.orders.getOrder({ id: culqiIdToQuery });

      // ✅ Actualizar si ya fue pagado
      if (culqiOrder.state === "paid" && payment.status !== "completed") {
        payment.status = "completed";
        payment.gatewayResponse = culqiOrder;
        await payment.save();
        console.log(`✅ Payment ${payment._id} actualizado a completed`);
      }
    } catch (culqiError: any) {
      console.error(`❌ Error consultando orden en Culqi: ${culqiError.merchant_message || culqiError.message}`);
      
      // Si la orden no existe o expiró en Culqi
      if (culqiError.type === 'parameter_error' || culqiError.merchant_message?.includes('No existe')) {
        orderExpired = true;
        
        // Marcar el payment como expirado si aún está pending
        if (payment.status === 'pending') {
          payment.status = 'expired';
          payment.gatewayResponse = { 
            ...payment.gatewayResponse,
            error: culqiError,
            expired_at: new Date()
          };
          await payment.save();
          console.log(`⚠️ Payment ${payment._id} marcado como expired`);
        }
        
        // Usar la información guardada localmente si existe
        culqiOrder = payment.gatewayResponse || null;
      } else {
        // Otro tipo de error (red, timeout, etc.)
        throw culqiError;
      }
    }

    return res.status(200).json({
      success: true,
      message: orderExpired 
        ? "La orden ha expirado en Culqi" 
        : "Estado de pago obtenido correctamente",
      payment,
      culqiOrder,
      orderExpired,
    });
  } catch (error: any) {
    console.error("❌ Error al obtener orden:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener orden",
      error: error.message || error.merchant_message || "Error desconocido",
    });
  }
};




/**
 * ============================================
 * GET /api/culqi/payment/:paymentId
 * Obtiene el detalle de un pago interno
 * ============================================
 */
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId)
      .populate("orderId")
      .populate("customerId");

    if (!payment) return res.status(404).json({ message: "Pago no encontrado" });

    res.json({ success: true, payment });
  } catch (error: any) {
    console.error("❌ Error al obtener pago:", error);
    res.status(500).json({ message: "Error al obtener pago", error: error.message });
  }
};

// DEBUG: GET /api/culqi/payment/culqi/:culqiOrderId
export const getPaymentByCulqiId = async (req: Request, res: Response) => {
  try {
    const { culqiOrderId } = req.params;
    console.log(`🔎 Buscando Payment con culqiOrderId=${culqiOrderId}`);
    const payment = await Payment.findOne({ culqiOrderId })
      .populate("orderId")
      .populate("customerId");

    if (!payment) {
      console.warn(`Payment no encontrado para culqiOrderId=${culqiOrderId}`);
      return res.status(404).json({ success: false, message: "Pago no encontrado" });
    }

    res.json({ success: true, payment });
  } catch (error: any) {
    console.error("❌ Error getPaymentByCulqiId:", error);
    res.status(500).json({ success: false, message: "Error interno", error: error.message });
  }
};

/* ===============================
   FUNCIONES AUXILIARES WEBHOOK
================================ */
async function handleOrderStatusChanged(data: any) {
  try {
    const payment = await Payment.findOne({ culqiOrderId: data.id });
    if (!payment) return;

    if (data.state === "paid") payment.status = "completed";
    else if (data.state === "expired") payment.status = "failed";

    payment.gatewayResponse = data;
    payment.updatedAt = new Date();
    await payment.save();

    if (data.state === "paid") {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = "confirmed";
        order.paymentStatus = "paid";
        await order.save();

        const conversation = await Conversation.findOne({ phone: order.customerPhone });
        if (conversation) {
          conversation.currentStep = "completed";
          conversation.lastMessage = "Pago completado exitosamente";
          await conversation.save();
        }
      }
    }
  } catch (error) {
    console.error("❌ Error handleOrderStatusChanged:", error);
  }
}

async function handleChargeSucceeded(data: any) {
  try {
    const orderId = data.metadata?.order_id;
    if (!orderId) return;

    const order = await Order.findById(orderId);
    if (!order) return;

    order.status = "confirmed";
    order.paymentStatus = "paid";
    await order.save();

    const payment = await Payment.findOne({ transactionId: data.id });
    if (payment) {
      payment.status = "completed";
      payment.receiptUrl = data.receipt_url || undefined;
      payment.gatewayResponse = data;
      payment.updatedAt = new Date();
      await payment.save();
    }
  } catch (error) {
    console.error("❌ Error handleChargeSucceeded:", error);
  }
}

async function handleChargeFailed(data: any) {
  try {
    const payment = await Payment.findOne({ transactionId: data.id });
    if (payment) {
      payment.status = "failed";
      payment.gatewayResponse = data;
      payment.updatedAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = "failed";
        await order.save();
      }
    }
  } catch (error) {
    console.error("❌ Error handleChargeFailed:", error);
  }
}

async function handleRefundCreated(data: any) {
  try {
    const payment = await Payment.findOne({ transactionId: data.charge_id });
    if (payment) {
      payment.status = "refunded";
      payment.gatewayResponse = data;
      payment.updatedAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = "cancelled";
        order.paymentStatus = "refunded";
        await order.save();
      }
    }
  } catch (error) {
    console.error("❌ Error handleRefundCreated:", error);
  }
}

/**
 * ============================================
 * GET /api/culqi/order/:culqiOrderId
 * Obtiene los datos de una orden para mostrar en el checkout
 * NOTA: Este endpoint debe retornar la estructura esperada por el frontend
 * ============================================
 */
export const getOrderForCheckout = async (req: Request, res: Response) => {
  try {
    const { culqiOrderId } = req.params;
    
    console.log(`🔍 Buscando orden con culqiOrderId: ${culqiOrderId}`);
    
    const payment = await Payment.findOne({ culqiOrderId })
      .populate("orderId")
      .populate("customerId");

    if (!payment) {
      console.warn(`Payment no encontrado para culqiOrderId: ${culqiOrderId}`);
      return res.status(404).json({ 
        success: false,
        message: "Orden no encontrada" 
      });
    }

    console.log(`✅ Payment encontrado: ${payment._id}, estado: ${payment.status}`);

    // Obtener info actualizada de Culqi
    let culqiOrder: any;
    try {
      culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
      console.log(`✅ Orden Culqi obtenida, estado: ${culqiOrder.state}`);
      
      // ✅ IMPORTANTE: Actualizar estado si ya fue pagado en Culqi
      if (culqiOrder.state === "paid" && payment.status !== "completed") {
        payment.status = "completed";
        payment.gatewayResponse = culqiOrder;
        await payment.save();
        
        // Actualizar la orden también
        if (payment.orderId) {
          const order = payment.orderId as any;
          order.status = "confirmed";
          order.paymentStatus = "paid";
          await order.save();
          console.log(`✅ Orden ${order.orderNumber} actualizada a 'paid'`);
        }
      }
    } catch (culqiError: any) {
      console.error("Error obteniendo orden de Culqi:", culqiError.message);
      // Continuar con la info local si Culqi falla
      culqiOrder = payment.gatewayResponse || null;
    }

    // Verificar si ya fue pagado
    if (payment.status === "completed" || culqiOrder?.state === "paid") {
      return res.status(200).json({ 
        success: true,
        message: "Esta orden ya fue pagada",
        alreadyPaid: true,
        payment: payment.toObject(),
        orderId: payment.orderId ? (payment.orderId as any)._id : null
      });
    }

    // Retornar estructura compatible con el frontend
    res.json({
      success: true,
      payment: payment.toObject(),
      culqiOrder: culqiOrder ? {
        id: culqiOrder.id,
        order_number: culqiOrder.order_number,
        description: culqiOrder.description,
        amount: culqiOrder.amount,
        currency: culqiOrder.currency_code || "PEN",
        state: culqiOrder.state,
        expiration_date: culqiOrder.expiration_date,
        customer: culqiOrder.client_details || {},
      } : null
    });
  } catch (error: any) {
    console.error("❌ Error al obtener orden para checkout:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener orden", 
      error: error.message 
    });
  }
};

/**
 * ============================================
 * POST /api/culqi/sync-payments
 * Sincroniza todos los pagos pendientes consultando el estado en Culqi
 * Útil cuando los pagos se realizan manualmente en el panel de Culqi
 * ============================================
 */
export const syncPendingPayments = async (req: Request, res: Response) => {
  try {
    console.log("🔄 Iniciando sincronización de pagos pendientes...");

    // Obtener todos los pagos pendientes
    const pendingPayments = await Payment.find({ status: "pending" })
      .populate("orderId")
      .populate("customerId");

    if (!pendingPayments || pendingPayments.length === 0) {
      return res.json({
        success: true,
        message: "No hay pagos pendientes para sincronizar",
        synced: 0,
        total: 0,
      });
    }

    console.log(`📦 Encontrados ${pendingPayments.length} pagos pendientes`);

    let syncedCount = 0;
    let errorCount = 0;
    const results = [];

    // Iterar sobre cada pago pendiente
    for (const payment of pendingPayments) {
      try {
        if (!payment.culqiOrderId) {
          console.warn(`⚠️ Payment ${payment._id} no tiene culqiOrderId`);
          results.push({
            paymentId: payment._id,
            status: "skipped",
            reason: "No culqiOrderId",
          });
          continue;
        }

        // Consultar estado en Culqi
        const culqiOrder = await culqi.orders.getOrder({ id: payment.culqiOrderId });
        console.log(`🔍 Payment ${payment._id} - Estado en Culqi: ${culqiOrder.state}`);

        // Si el estado cambió a "paid", actualizar localmente
        if (culqiOrder.state === "paid" && payment.status !== "completed") {
          // Actualizar payment
          payment.status = "completed";
          payment.gatewayResponse = culqiOrder;
          payment.updatedAt = new Date();
          await payment.save();

          // Actualizar orden asociada
          if (payment.orderId) {
            const order = await Order.findById(payment.orderId);
            if (order) {
              order.status = "confirmed";
              order.paymentStatus = "paid";
              await order.save();
              console.log(`✅ Orden ${order.orderNumber} sincronizada y marcada como pagada`);
            }
          }

          syncedCount++;
          results.push({
            paymentId: payment._id,
            culqiOrderId: payment.culqiOrderId,
            status: "synced",
            previousStatus: "pending",
            newStatus: "completed",
            orderId: payment.orderId,
          });
        } else if (culqiOrder.state === "expired") {
          // Marcar como fallido si expiró
          payment.status = "failed";
          payment.gatewayResponse = culqiOrder;
          await payment.save();

          results.push({
            paymentId: payment._id,
            culqiOrderId: payment.culqiOrderId,
            status: "expired",
            message: "Pago expirado en Culqi",
          });
        } else {
          // Sin cambios
          results.push({
            paymentId: payment._id,
            culqiOrderId: payment.culqiOrderId,
            status: "unchanged",
            culqiState: culqiOrder.state,
          });
        }
      } catch (paymentError: any) {
        console.error(`❌ Error sincronizando payment ${payment._id}:`, paymentError.message);
        errorCount++;
        results.push({
          paymentId: payment._id,
          culqiOrderId: payment.culqiOrderId,
          status: "error",
          error: paymentError.message,
        });
      }
    }

    console.log(`✅ Sincronización completada: ${syncedCount} actualizados, ${errorCount} errores`);

    res.json({
      success: true,
      message: `Sincronización completada`,
      synced: syncedCount,
      errors: errorCount,
      total: pendingPayments.length,
      results,
    });
  } catch (error: any) {
    console.error("❌ Error en sincronización de pagos:", error);
    res.status(500).json({
      success: false,
      message: "Error al sincronizar pagos",
      error: error.message,
    });
  }
};

/**
 * ============================================
 * POST /api/culqi/sync-order/:culqiOrderId
 * Sincroniza una orden específica desde Culqi
 * ============================================
 */
export const syncSpecificOrder = async (req: Request, res: Response) => {
  try {
    const { culqiOrderId } = req.params;

    if (!culqiOrderId) {
      return res.status(400).json({
        success: false,
        message: "culqiOrderId es requerido",
      });
    }

    console.log(`🔍 Sincronizando orden específica: ${culqiOrderId}`);

    // Buscar el payment asociado
    const payment = await Payment.findOne({ culqiOrderId })
      .populate("orderId")
      .populate("customerId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado en la base de datos",
      });
    }

    // Consultar estado en Culqi con manejo de errores
    let culqiOrder: any = null;
    let orderExpired = false;
    let updated = false;

    try {
      culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
      console.log(`Estado en Culqi: ${culqiOrder.state}`);

      // Actualizar si el estado cambió
      if (culqiOrder.state === "paid" && payment.status !== "completed") {
        payment.status = "completed";
        payment.gatewayResponse = culqiOrder;
        payment.updatedAt = new Date();
        await payment.save();

        // Actualizar orden
        if (payment.orderId) {
          const order = await Order.findById(payment.orderId);
          if (order) {
            order.status = "confirmed";
            order.paymentStatus = "paid";
            await order.save();
            console.log(`✅ Orden ${order.orderNumber} actualizada`);
          }
        }

        updated = true;
      }
    } catch (culqiError: any) {
      console.error(`❌ Error consultando Culqi: ${culqiError.merchant_message || culqiError.message}`);
      
      // Si la orden no existe o expiró
      if (culqiError.type === 'parameter_error' || culqiError.merchant_message?.includes('No existe')) {
        orderExpired = true;
        
        // Marcar como expirado si aún está pending
        if (payment.status === 'pending') {
          payment.status = 'expired';
          payment.gatewayResponse = { 
            ...payment.gatewayResponse,
            error: culqiError,
            expired_at: new Date()
          };
          await payment.save();
          console.log(`⚠️ Payment ${payment._id} marcado como expired`);
          updated = true;
        }
        
        return res.json({
          success: true,
          message: "La orden ha expirado en Culqi. Estado local actualizado.",
          orderExpired: true,
          payment,
          updated,
        });
      }
      
      throw culqiError;
    }

    res.json({
      success: true,
      message: updated ? "Orden sincronizada exitosamente" : "Orden sin cambios",
      payment,
      culqiOrder,
      orderExpired,
      updated,
    });
  } catch (error: any) {
    console.error("❌ Error sincronizando orden específica:", error);
    res.status(500).json({
      success: false,
      message: "Error al sincronizar orden",
      error: error.message || error.merchant_message,
    });
  }
};