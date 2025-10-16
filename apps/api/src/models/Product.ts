import { Schema, model } from "mongoose";

const productSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

export const Product = model("Product", productSchema);
