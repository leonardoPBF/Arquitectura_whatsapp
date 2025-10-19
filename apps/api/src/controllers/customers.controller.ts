import { Request, Response } from "express";
import { Customer } from "../models/Customer";

// GET /api/customers
export const getCustomers = async (_: Request, res: Response) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error });
  }
};

// GET /api/customers/:id
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cliente", error });
  }
};

// GET /api/customers/phone/:phone
export const getCustomerByPhone = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar cliente", error });
  }
};

// POST /api/customers
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const existing = await Customer.findOne({ phone: req.body.phone });
    if (existing) return res.status(200).json(existing);

    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: "Error al crear cliente", error });
  }
};

// PUT /api/customers/:id
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar cliente", error });
  }
};

// PATCH /api/customers/:id/spent
export const updateCustomerSpent = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });

    customer.totalOrders += 1;
    customer.totalSpent += amount;
    await customer.save();

    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar gasto del cliente", error });
  }
};

// DELETE /api/customers/:id
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json({ message: "Cliente eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cliente", error });
  }
};
