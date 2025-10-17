import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId;
  orderNumber: string;
  customerId: Schema.Types.ObjectId;
  amount: number;
  method: "cash" | "transfer" | "card" | "yape" | "plin";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  orderNumber: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { 
    type: String, 
    enum: ["cash", "transfer", "card", "yape", "plin"],
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending" 
  },
  transactionId: { type: String },
  receiptUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Payment = model<IPayment>("Payment", PaymentSchema);