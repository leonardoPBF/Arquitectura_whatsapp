import { Request, Response } from "express";
import { Order } from "../models/Order";
import { IProduct, Product } from "../models/Product";
import { Customer } from "../models/Customer";

import { identity } from "../middlewares/security";


// GET /api/orders
export const getOrders = async (_req: Request, res: Response) => {
  try {
    const principal = identity(res);
    const orders = await Order.find(principal.role === 'customer' ? { customerId: principal.customerId } : {})
      .populate("customerId")
      .populate("items.productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener órdenes", error });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId")
      .populate("items.productId");
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener orden", error });
  }
};

// GET /api/orders/customer/:customerId
export const getOrdersByCustomer = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener órdenes del cliente", error });
  }
};

// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  try {
    let { customerId, items } = req.body;
    const { customer: customerData, deliveryAddress, shippingAddress, notes } = req.body;

    if (!Array.isArray(items) || items.length < 1 || items.length > 50 || items.some(item =>
      !item || typeof item.productId !== 'string' || !/^[a-f\d]{24}$/i.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) {
      return res.status(400).json({ message: 'Productos o cantidades inválidos' });
    }
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }

    // Fallback: Si no se proporciona customerId o no existe, intentar resolver o crear un Customer
    if (!customer && customerData) {
      if (customerData.phone) {
        customer = await Customer.findOne({ phone: customerData.phone });
      }
      if (!customer && customerData.email) {
        customer = await Customer.findOne({ email: customerData.email });
      }

      // Si aún así no existe, crear un nuevo Customer
      if (!customer) {
        customer = new Customer({
          name: customerData.name || "Cliente Sin Nombre",
          email: customerData.email || "",
          phone: customerData.phone || `TEMP-${Date.now()}`,
        });
        await customer.save();
      }

      customerId = customer._id;
    }

    if (!customerId || !customer || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const products = await Product.find({ _id: { $in: items.map(i => i.productId) } }) as (IProduct & { _id: any })[];
    let totalAmount = 0;

    const detailedItems = items.map(item => {
      const product = products.find(p => p._id.equals(item.productId));
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      const productName = product.name;
      return { productId: product._id, productName, quantity: item.quantity, price: product.price, subtotal };
    });

    let finalDeliveryAddress = "";
    if (typeof deliveryAddress === "string") {
      finalDeliveryAddress = deliveryAddress;
    } else if (shippingAddress) {
      const { address, city, zipCode } = shippingAddress;
      finalDeliveryAddress = [address, city, zipCode].filter(Boolean).join(", ");
    }

    const order = new Order({
      customerId,
      customerPhone: customer.phone,
      items: detailedItems,
      totalAmount,
      status: "pending",
      deliveryAddress: finalDeliveryAddress || undefined,
      notes: notes || undefined,
      createdAt: new Date(),
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al crear orden", error });
  }
};

// Order transitions are checked server-side and applied atomically.
const transitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped'], shipped: ['delivered'], delivered: [], cancelled: [],
};
async function transition(req: Request, res: Response, target: unknown) {
  if (typeof target !== 'string' || !Object.prototype.hasOwnProperty.call(transitions, target)) return res.status(400).json({ message: 'Estado inválido' });
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.sendStatus(404);
    if (order.status === target) return res.json(order); // Idempotent retry.
    if (!transitions[order.status]?.includes(target) || (target === 'cancelled' && order.paymentStatus !== 'pending')) {
      return res.status(409).json({ message: 'Transición no permitida; los pagos requieren gestión de reembolso' });
    }
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status, paymentStatus: order.paymentStatus },
      { $set: { status: target, updatedAt: new Date() } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ message: 'La orden cambió; actualiza antes de continuar' });
    console.info('order.transition', { actor: identity(res).id, orderId: String(order._id), from: order.status, to: target });
    return res.json(updated);
  } catch { return res.status(400).json({ message: 'No se pudo actualizar la orden' }); }
}
export const updateOrderStatus = (req: Request, res: Response) => transition(req, res, req.body.status);
export const cancelOrder = (req: Request, res: Response) => transition(req, res, 'cancelled');
export const deleteOrder = (_req: Request, res: Response) => res.status(405).json({ message: 'Las órdenes se cancelan, no se eliminan' });
export const updateOrder = async (req: Request, res: Response) => {
  const keys = Object.keys(req.body || {});
  if (keys.length === 1 && keys[0] === 'status') return transition(req, res, req.body.status);
  if (!keys.length || keys.some(key => !['deliveryAddress', 'notes'].includes(key) || typeof req.body[key] !== 'string' || req.body[key].length > 1000)) {
    return res.status(400).json({ message: 'Solo se permite actualizar dirección y notas, o un estado válido' });
  }
  try {
    const principal = identity(res);
    const filter = principal.role === 'customer'
      ? { _id: req.params.id, customerId: principal.customerId, status: 'pending', paymentStatus: 'pending' }
      : { _id: req.params.id };
    const order = await Order.findOneAndUpdate(filter, { $set: { ...req.body, updatedAt: new Date() } }, { new: true, runValidators: true });
    return order ? res.json(order) : res.sendStatus(404);
  } catch { return res.status(400).json({ message: 'Orden inválida' }); }
};
