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

    // 1️⃣ Crear la orden en Culqi
    const culqiOrder = await culqi.orders.createOrder({
      amount: Math.round(order.totalAmount * 100), // Monto en centavos
      currency_code: currency,
      description: `Orden #${order.orderNumber}`,
      order_number: order.orderNumber,
      client_details: {
        first_name: user.name.split(' ')[0] || user.name,
        last_name: user.name.split(' ').slice(1).join(' ') || user.name,
        email: String(user.email),
        phone_number: user.phone || "+51999999999",
      },
      expiration_date: Math.floor(Date.now() / 1000) + 86400, // 24 horas
    });

    console.log("✅ Orden Culqi creada:", culqiOrder.id);

    const checkoutUrl = `${process.env.LOCAL_LINK}?order=${culqiOrder.id}`;

    const payment = await Payment.create({
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
 * Crea un cargo directo (tarjeta o token)
 * ============================================
 */
export const createCulqiCharge = async (req: Request, res: Response) => {
  try {
    const { tokenId, culqiOrderId, amount, email } = req.body;

    if (!tokenId || !culqiOrderId || !amount){
      return res.status(400).json({ message: "tokenId, orderId y amount son requeridos" });
    }
     
    const payment = await Payment.findOne({ culqiOrderId }).populate("orderId");

        if (!payment || !payment.orderId) {
      return res.status(404).json({ message: "No se encontró la orden asociada al culqiOrderId" });
    }

    const order = payment.orderId as any; // el populate devuelve el documento Order

    // ✅ Crear el cargo directo en Culqi
    const charge = await culqi.charges.createCharge({
      amount: Math.round(amount * 100).toString(),
      currency_code: "PEN",
      email: email || "cliente@example.com",
      source_id: tokenId,
      description: `Pago Orden #${order.orderNumber}`,
      metadata: { order_id: culqiOrderId, order_number: order.orderNumber },
    });

    const isSuccessful = charge.outcome?.type === "venta_exitosa";

    if (isSuccessful) {
      order.status = "confirmed";
      order.paymentStatus = "paid";
      await order.save();

      // ✅ Actualiza el mismo registro de Payment
      payment.status = "completed";
      payment.transactionId = charge.id;
      payment.receiptUrl = (charge as any).receipt_url;
      payment.gatewayResponse = charge;
      await payment.save();

      return res.json({ success: true, charge, order, payment });
    }

    res.status(400).json({ success: false, message: "Cargo rechazado", charge });
  } catch (error: any) {
    console.error("❌ Error al crear cargo:", error);
    res.status(500).json({ message: "Error al procesar pago", error: error.message });
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
    if (!culqiOrderId) return res.status(400).json({ message: "culqiOrderId es requerido" });

    const payment = await Payment.findOne({ culqiOrderId });
    if (!payment) return res.status(404).json({ message: "Pago no encontrado" });

    const culqiCharge = await culqi.charges.getCharge({ id: payment.transactionId+"" });

    if (culqiCharge.paid === true) {
      payment.status = "completed";
      payment.gatewayResponse = culqiCharge;
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = "confirmed";
        order.paymentStatus = "paid";
        await order.save();
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
      payment,
    });
  } catch (error: any) {
    console.error("❌ Error al confirmar orden:", error);
    res.status(500).json({ message: "Error al confirmar orden", error: error.message });
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
    const { paymentId } = req.params;

    // ✅ Buscar el pago por su _id en Mongo
    const payment = await Payment.findById(paymentId)
      .populate("orderId")
      .populate("customerId");

    if (!payment) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // ✅ Obtener el estado actual desde Culqi (usando su culqiOrderId)
    const culqiOrder = await culqi.orders.getOrder({ id: payment.culqiOrderId });

    // ✅ Actualizar si ya fue pagado
    if (culqiOrder.state === "paid" && payment.status !== "completed") {
      payment.status = "completed";
      payment.gatewayResponse = culqiOrder;
      await payment.save();
    }

    return res.status(200).json({
      success: true,
      message: "Estado de pago obtenido correctamente",
      payment,
      culqiOrder,
    });
  } catch (error: any) {
    console.error("❌ Error al obtener orden:", error);
    return res.status(500).json({
      message: "Error al obtener orden",
      error: error.message,
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
    
    const payment = await Payment.findOne({ culqiOrderId }).populate("culqiOrderId");

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Orden no encontradas" 
      });
    }

    // Verificar si ya fue pagado
    if (payment.status === "completed") {
      return res.status(400).json({ 
        success: false,
        message: "Esta orden ya fue pagada",
        alreadyPaid: true 
      });
    }

    // Obtener info actualizada de Culqi
    const culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });

    // Retornar estructura compatible con el frontend
    res.json({
      success: true,
      payment: {
        ...payment.toObject(),
        customerId: payment.customerId, // Ya viene populado
      },
      culqiOrder: {
        id: culqiOrder.id,
        order_number: culqiOrder.order_number,
        description: culqiOrder.description,
        amount: culqiOrder.amount,
        currency_code: culqiOrder.currency_code,
        state: culqiOrder.state,
        expiration_date: culqiOrder.expiration_date,
      }
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
