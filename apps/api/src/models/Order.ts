// models/Order.ts
import { Schema, model, Document } from "mongoose";
import { Counter } from "./Counter";

export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: Schema.Types.ObjectId;
  customerPhone: string;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, unique: true, default: null },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  customerPhone: { type: String, required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"],
    default: "pending" 
  },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "refunded", "failed"],
    default: "pending" 
  },
  deliveryAddress: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Antes de guardar, genera el número de orden incremental
OrderSchema.pre("save", async function (next) {
  const order = this as IOrder;

  if (!order.isNew) return next();

  const counter = await Counter.findOneAndUpdate(
    { name: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // genera formato corto tipo ORD-000001
  order.orderNumber = `ORD-${counter.seq.toString().padStart(6, "0")}`;

  next();
});

export const Order = model<IOrder>("Order", OrderSchema);
