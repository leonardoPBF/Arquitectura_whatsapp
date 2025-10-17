import { Request, Response } from "express";
import { Payment } from "../models/Payment";

// GET /api/payments
export const getPayments = async (_: Request, res: Response) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pagos", error });
  }
};

// GET /api/payments/:id
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment)
      return res.status(404).json({ message: "Pago no encontrado" });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pago", error });
  }
};

// POST /api/payments
export const createPayment = async (req: Request, res: Response) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: "Error al registrar pago", error });
  }
};

// PATCH /api/payments/:id/status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!payment)
      return res.status(404).json({ message: "Pago no encontrado" });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar estado de pago", error });
  }
};
