import axios from 'axios';
import { createHash, randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Payment, IPayment } from '../models/Payment';
import { Order } from '../models/Order';
import { Customer } from '../models/Customer';

type Charge = {
  action_code?: string;
  id: string; amount: number; currency_code?: string; currency?: string;
  outcome?: { type?: string; decline_code?: string }; metadata?: Record<string, string>;
};
const provider = () => axios.create({ baseURL: 'https://api.culqi.com/v2', timeout: 20000,
  headers: { Authorization: `Bearer ${process.env.CULQI_PRIVATE_KEY}` } });
// Kept as an object so tests can exercise real locking with a controlled provider.
export const chargeGateway = {
  create: async (payload: Record<string, unknown>): Promise<Charge> => (await provider().post('/charges', payload)).data,
  get: async (id: string): Promise<Charge> => (await provider().get(`/charges/${id}`)).data,
  list: async (from: Date, after?: string): Promise<Charge[]> => {
    const result = await provider().get('/charges', { params: {
      creation_date_from: Math.floor(from.getTime() / 1000) - 60, limit: 100, after,
    } });
    return result.data.data;
  },
};

export async function prepareCardPayment(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Pedido no encontrado');
  const previous = await Payment.findOne({ orderId, gateway: 'culqi' });
  if (previous) return previous;
  if (order.status !== 'pending' || order.paymentStatus !== 'pending' || (order.paymentSetup && order.paymentSetup !== 'card')) {
    throw new Error('El pedido no está disponible para iniciar un pago');
  }
  const claimed = await Order.findOneAndUpdate({ _id: orderId, status: 'pending', paymentStatus: 'pending',
    $or: [{ paymentSetup: { $exists: false } }, { paymentSetup: 'card' }],
  }, { $set: { paymentSetup: 'card' } });
  if (!claimed) throw new Error('El pedido ya tiene otro medio de pago');
  const checkoutUrl = `${process.env.LOCAL_LINK}?order=${orderId}`;
  // The order's ObjectId is also the payment's stable primary key. Concurrent
  // checkout preparations cannot insert two card payments for the same order.
  return Payment.findOneAndUpdate({ _id: orderId }, { $setOnInsert: {
    orderId, orderNumber: order.orderNumber, customerId: order.customerId,
    amount: order.totalAmount, gateway: 'culqi', method: 'card', status: 'pending', checkoutUrl,
  } }, { upsert: true, new: true, runValidators: true });
}

async function reconcileDecline(payment: IPayment, charge: Charge) {
  if (charge.outcome?.decline_code === 'authentication_required' && payment.tokenFingerprint) return;
  if (charge.outcome?.type !== 'operacion_denegada' || !['authentication_required', 'insufficient_funds', 'stolen_card', 'lost_card', 'incorrect_cvv', 'card_expired', 'invalid_card'].includes(charge.outcome.decline_code || '') ||
      charge.amount !== Math.round(payment.amount * 100) || (charge.currency_code || charge.currency) !== 'PEN' ||
      charge.metadata?.payment_attempt !== payment.attemptId || charge.metadata?.order_id !== String(payment.orderId)) return;
  const result = await Payment.updateOne({ _id: payment._id, attemptId: payment.attemptId, status: { $in: ['review', 'processing'] } }, { $set: { status: 'failed', transactionId: charge.id, gatewayResponse: charge, updatedAt: new Date() } });
  if (result.modifiedCount) await Order.updateOne({ _id: payment.orderId, paymentStatus: 'pending' }, { $set: { paymentLock: false } });
}

async function settle(payment: IPayment, charge: Charge) {
  if (charge.outcome?.type !== 'venta_exitosa' || charge.amount !== Math.round(payment.amount * 100) ||
      (charge.currency_code || charge.currency) !== 'PEN' ||
      charge.metadata?.payment_attempt !== payment.attemptId ||
      charge.metadata?.order_id !== String(payment.orderId)) return false;
  // Persist provider evidence first; reconciliation can repair an interrupted
  // order update. Never release the lock after an uncertain result.
  await Payment.updateOne({ _id: payment._id, attemptId: payment.attemptId }, { $set: {
    transactionId: charge.id, status: 'completed', gatewayResponse: charge, updatedAt: new Date(),
  } });
  await Order.updateOne({ _id: payment.orderId, paymentStatus: 'pending' }, {
    $set: { status: 'confirmed', paymentStatus: 'paid', paymentLock: true, updatedAt: new Date() },
  });
  await Payment.updateOne({ _id: payment._id }, { $set: { orderSynced: true } });
  return true;
}

export async function reconcileCardPayment(payment: IPayment) {
  if (!payment.attemptId || !payment.attemptStartedAt) return;
  if (payment.transactionId) {
    const charge = await chargeGateway.get(payment.transactionId);
    if (!await settle(payment, charge)) await reconcileDecline(payment, charge);
    return;
  }
  let after: string | undefined;
  // A missing charge is not proof of rejection. The payment remains locked.
  for (let page = 0; page < 10; page++) {
    const charges = await chargeGateway.list(payment.attemptStartedAt, after);
    if (!Array.isArray(charges)) throw new Error('Respuesta de conciliación inválida');
    const matching = charges.filter(item => item.metadata?.payment_attempt === payment.attemptId);
    const charge = matching.find(item => item.outcome?.type === 'venta_exitosa') || matching.find(item => item.outcome?.decline_code !== 'authentication_required') || (!payment.tokenFingerprint ? matching[0] : undefined);
    if (charge) { if (!await settle(payment, charge)) await reconcileDecline(payment, charge); return; }
    if (charges.length < 100) return;
    after = charges[charges.length - 1].id;
  }
}

async function paymentForRequest(req: Request) {
  return Payment.findOne(typeof req.body.orderId === 'string'
    ? { orderId: req.body.orderId, gateway: 'culqi' } : { culqiOrderId: req.body.culqiOrderId });
}

export async function directCharge(req: Request, res: Response) {
  let payment: IPayment | null = null;
  let locked = false;
  try {
    const { tokenId, deviceId, authentication3DS, attemptId } = req.body;
    if (deviceId !== undefined && (typeof deviceId !== 'string' || !/^[\w-]{1,128}$/.test(deviceId))) return res.status(400).json({ message: 'Dispositivo inválido' });
    if (authentication3DS !== undefined && (!authentication3DS || typeof authentication3DS !== 'object' ||
        !['eci', 'xid', 'cavv', 'protocolVersion'].every(key => typeof authentication3DS[key] === 'string' && authentication3DS[key].length > 0 && authentication3DS[key].length <= 512) ||
        Object.keys(authentication3DS).some(key => !['eci', 'xid', 'cavv', 'protocolVersion', 'directoryServerTransactionId'].includes(key)) ||
        (authentication3DS.directoryServerTransactionId !== undefined && (typeof authentication3DS.directoryServerTransactionId !== 'string' || authentication3DS.directoryServerTransactionId.length > 128)))) {
      return res.status(400).json({ message: 'Parámetros 3DS inválidos' });
    }
    if (!(typeof req.body.orderId === 'string' && /^[a-f\d]{24}$/i.test(req.body.orderId)) &&
        !(typeof req.body.culqiOrderId === 'string' && /^ord_(test|live)_\w+$/.test(req.body.culqiOrderId))) {
      return res.status(400).json({ message: 'Identificador de pedido inválido' });
    }
    if (typeof tokenId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(tokenId)) return res.status(400).json({ message: 'Token de pago inválido' });
    payment = await paymentForRequest(req);
    if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
    const order = await Order.findById(payment.orderId);
    if (!order) return res.sendStatus(404);
    if (req.body.amount !== undefined && req.body.amount !== payment.amount) return res.status(400).json({ message: 'El importe debe coincidir con el pago registrado' });
    if (payment.status === 'completed' || order.paymentStatus === 'paid') return res.json({ success: true, alreadyPaid: true, orderId: order._id });
    if (payment.method !== 'card') return res.status(409).json({ message: 'Este pedido tiene otro medio de pago activo' });
    if (payment.amount !== order.totalAmount || !Number.isFinite(payment.amount) || payment.amount <= 0) return res.status(409).json({ message: 'Importe de pago inválido' });
    const customer = await Customer.findById(order.customerId);
    if (!customer?.email) return res.status(400).json({ message: 'El cliente requiere un correo para pagar' });
    const fingerprint = createHash('sha256').update(tokenId).digest('hex');
    if (authentication3DS) {
      // Exactly one continuation may reuse the locked attempt and its original source/device.
      if (typeof attemptId !== 'string' || !attemptId || !deviceId || !order.paymentLock || order.status !== 'pending') return res.status(409).json({ pending: true, message: 'Intento 3DS inválido' });
      const continuation = await Payment.findOneAndUpdate({ _id: payment._id, status: 'requires_action',
        attemptId, tokenFingerprint: fingerprint, deviceId,
      }, { $set: { status: 'processing', updatedAt: new Date() } }, { new: true });
      if (!continuation || !attemptId || !deviceId || !order.paymentLock) return res.status(409).json({ pending: true, message: 'La autenticación no corresponde a un intento pendiente' });
      payment = continuation;
      locked = true;
    } else {
      const claimed = await Order.findOneAndUpdate({ _id: order._id, status: 'pending', paymentStatus: 'pending', paymentLock: { $ne: true } }, { $set: { paymentLock: true } });
      if (!claimed) return res.status(409).json({ message: 'El pedido ya está pagado, cancelado o tiene un pago en verificación. Revisa Mis Pedidos.', pending: true });
      locked = true;
      payment.attemptId = randomUUID();
      payment.attemptStartedAt = new Date();
      payment.transactionId = undefined;
      payment.gatewayResponse = undefined;
      payment.tokenFingerprint = fingerprint;
      payment.deviceId = deviceId;
      payment.status = 'processing';
      await payment.save();
    }
    const charge = await chargeGateway.create({
      amount: Math.round(payment.amount * 100), currency_code: 'PEN', source_id: tokenId,
      email: customer.email, description: `Pago Orden #${order.orderNumber}`,
      antifraud_details: { first_name: customer.name.split(' ')[0], last_name: customer.name.split(' ').slice(1).join(' ') || 'Cliente', phone_number: customer.phone, ...(deviceId ? { device_finger_print_id: deviceId } : {}) },
      ...(authentication3DS ? { authentication_3DS: authentication3DS } : {}),
      metadata: { order_id: String(order._id), payment_attempt: payment.attemptId },
    });
    if (((charge.action_code === 'REVIEW' && !charge.id) || charge.outcome?.decline_code === 'authentication_required') && !authentication3DS && deviceId) {
      payment.status = 'requires_action';
      payment.gatewayResponse = { action_code: 'REVIEW' };
      await payment.save();
      return res.json({ success: false, requiresAction: true, attemptId: payment.attemptId, orderId: order._id, message: 'Completa la autenticación de tu banco' });
    }
    payment.transactionId = charge.id;
    await payment.save();
    if (await settle(payment, charge)) return res.json({ success: true, orderId: order._id, paymentId: payment._id });
    // An unexpected response is not an invitation
    // to create a second charge. Keep it for provider reconciliation.
    payment.status = 'review';
    await payment.save();
    return res.status(202).json({ pending: true, message: 'Pago pendiente de verificación; no vuelvas a pagar', orderId: order._id });
  } catch (error) {
    if (payment && locked && axios.isAxiosError(error) && error.response?.data?.decline_code === 'authentication_required' && !req.body.authentication3DS && req.body.deviceId) {
      payment.status = 'requires_action';
      payment.gatewayResponse = { decline_code: 'authentication_required', chargeId: error.response.data.charge_id };
      await payment.save();
      return res.json({ success: false, requiresAction: true, attemptId: payment.attemptId, orderId: payment.orderId });
    }
    const decline = axios.isAxiosError(error) && error.response?.status === 400 &&
      error.response.data?.type === 'card_error' &&
      ['insufficient_funds', 'stolen_card', 'lost_card', 'incorrect_cvv', 'card_expired', 'invalid_card'].includes(error.response.data?.decline_code);
    if (payment && locked && decline) {
      await Payment.updateOne({ _id: payment._id, attemptId: payment.attemptId }, { $set: { status: 'failed', updatedAt: new Date() } });
      await Order.updateOne({ _id: payment.orderId, paymentStatus: 'pending' }, { $set: { paymentLock: false } });
      return res.status(400).json({ pending: false, message: 'La tarjeta fue rechazada. Puedes intentar con otra tarjeta.' });
    }
    if (payment && locked) await Payment.updateOne({ _id: payment._id }, { $set: { status: 'review' } }).catch(() => undefined);
    return res.status(locked ? 202 : 503).json({ pending: locked, message: locked
      ? 'Estamos verificando el resultado del pago. No vuelvas a pagar; consulta Mis Pedidos.' : 'No se pudo iniciar el pago' });
  }
}

export async function verifyDirectPayment(req: Request, res: Response) {
  try {
    const payment = await paymentForRequest(req);
    if (!payment) return res.sendStatus(404);
    return res.json({ success: payment?.status === 'completed', alreadyPaid: payment?.status === 'completed',
      requiresAction: payment.status === 'requires_action',
      pending: ['processing', 'review'].includes(payment.status), payment: { status: payment.status }, orderId: payment.orderId });
  } catch { return res.status(503).json({ message: 'No se pudo verificar el pago; no inicies otro cargo' }); }
}

export function startPaymentReconciliation() {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const payments = await Payment.find({ attemptId: { $exists: true },
        $or: [{ status: { $in: ['processing', 'review'] } }, { status: 'completed', orderSynced: { $ne: true } }],
        attemptStartedAt: { $lt: new Date(Date.now() - 60000), $gt: new Date(Date.now() - 7 * 86400000) },
      }).sort({ updatedAt: 1 }).limit(20);
      for (const payment of payments) {
        if (payment.status === 'completed') {
          await Order.updateOne({ _id: payment.orderId, paymentStatus: 'pending' }, { $set: { paymentStatus: 'paid', status: 'confirmed', paymentLock: true } });
          await Payment.updateOne({ _id: payment._id }, { $set: { orderSynced: true } });
          continue;
        }
        await reconcileCardPayment(payment).catch(() => console.warn('payment.reconciliation_pending'));
        await Payment.updateOne({ _id: payment._id }, { $set: { updatedAt: new Date() } });
      }
    } catch { console.warn('payment.reconciliation_unavailable'); }
    finally { running = false; }
  }, 60000);
  timer.unref();
  return timer;
}

// Only a provider-confirmed challenge with no submitted continuation may be cancelled.
export async function cancelCardAuthentication(req: Request, res: Response) {
  try {
    if (typeof req.body.orderId !== 'string' || !/^[a-f\d]{24}$/i.test(req.body.orderId)) return res.sendStatus(400);
    const cancelled = await Payment.findOneAndUpdate({ orderId: req.body.orderId, method: 'card',
      status: 'requires_action', transactionId: { $exists: false },
    }, { $set: { status: 'failed', updatedAt: new Date() } }, { new: true });
    if (!cancelled) return res.status(409).json({ message: 'El pago ya está en proceso o no espera autenticación' });
    await Order.updateOne({ _id: cancelled.orderId, paymentStatus: 'pending' }, { $set: { paymentLock: false } });
    return res.json({ success: true });
  } catch { return res.status(503).json({ message: 'No se pudo cancelar la autenticación' }); }
}
