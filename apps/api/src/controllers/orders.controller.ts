import { Request, Response } from "express";
import { Order } from "../models/Order";

// GET /api/orders
export const getOrders = async (_: Request, res: Response) => {
  try {
    const orders = await Order.find()
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
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al crear orden", error });
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar estado", error });
  }
};

// POST /api/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    if (order.status === "delivered")
      return res.status(400).json({ message: "No se puede cancelar una orden entregada" });

    order.status = "cancelled";
    await order.save();
    res.json({ message: "Orden cancelada", order });
  } catch (error) {
    res.status(500).json({ message: "Error al cancelar orden", error });
  }
};
