import { Request, Response } from "express";
import { Order } from "../models/Order";

export const createOrder = async (req: Request, res: Response) => {
  const order = new Order(req.body);
  await order.save();
  res.status(201).json(order);
};

export const getOrders = async (_: Request, res: Response) => {
  const orders = await Order.find().populate("customer").populate("products");
  res.json(orders);
};
