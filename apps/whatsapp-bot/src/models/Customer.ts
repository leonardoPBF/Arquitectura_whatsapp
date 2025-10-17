import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Customer = model<ICustomer>("Customer", CustomerSchema);