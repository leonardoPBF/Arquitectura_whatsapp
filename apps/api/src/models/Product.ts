import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  category: { type: String, enum: ["Tecnología", "Hogar", "Ropa", "Salud"], default: "Tecnología" },
  stock: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Product = model("Product", ProductSchema);
