import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId;
  orderNumber: string;
  customerId: Schema.Types.ObjectId;
  amount: number;
  gateway: "culqi";
  culqiOrderId: string; 
  checkoutUrl: string;
  method: "card" | "billetera_movil" | "pagoefectivo";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  receiptUrl?: string;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  orderNumber: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  amount: { type: Number, required: true, min: 0 },
  gateway: { type: String, enum: ["culqi"], default: "culqi", required: true },
  culqiOrderId: { type: String, unique: true, required: true },
  checkoutUrl: { type: String, required: true },
  method: { 
    type: String, 
    enum: ["card", "billetera_movil", "pagoefectivo"],
    required: true
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending" 
  },
  transactionId: { type: String },
  receiptUrl: { type: String },
  gatewayResponse: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Payment = model<IPayment>("Payment", PaymentSchema);