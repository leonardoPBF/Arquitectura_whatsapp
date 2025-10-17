import { Schema, model, Document } from "mongoose";

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
  paymentStatus: "pending" | "paid" | "refunded";
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
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
    enum: ["pending", "paid", "refunded"],
    default: "pending" 
  },
  deliveryAddress: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Order = model<IOrder>("Order", OrderSchema);