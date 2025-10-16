import { Schema, model } from "mongoose";

const CustomerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const Customer = model("Customer", CustomerSchema);
