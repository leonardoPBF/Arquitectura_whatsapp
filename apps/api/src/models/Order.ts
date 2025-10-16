import { Schema, model, Types } from "mongoose";

const OrderSchema = new Schema({
  customer: { type: Types.ObjectId, ref: "Customer", required: true },
  products: [
    {
      product: { type: Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1, min: 1 },
    },
  ],
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["YAPE", "CULQI"], required: true },
  status: { type: String, enum: ["PENDING", "PAID", "CANCELLED"], default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
});

export const Order = model("Order", OrderSchema);
