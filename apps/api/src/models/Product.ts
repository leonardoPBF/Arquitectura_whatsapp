import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  category: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Product = model<IProduct>("Product", ProductSchema);