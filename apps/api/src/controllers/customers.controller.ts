import { Request, Response } from "express";
import { Customer } from "../models/Customer";

export const getCustomers = async (_: Request, res: Response) => {
  const customers = await Customer.find();
  res.json(customers);
};

export const createCustomer = async (req: Request, res: Response) => {
  const customer = new Customer(req.body);
  await customer.save();
  res.status(201).json(customer);
};
