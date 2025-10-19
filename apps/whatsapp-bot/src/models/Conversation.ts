import { Schema, model, Document } from "mongoose";

export interface ICartItem {
  productId: Schema.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

export interface IConversation extends Document {
  phone: string;
  cart: ICartItem[];
  lastMessage: string;
  currentStep: string;
  updatedAt: Date;
}

const ConversationSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  cart: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String },
    quantity: { type: Number, min: 1 },
    price: { type: Number, min: 0 },
  }],
  lastMessage: { type: String, default: "" },
  currentStep: { type: String, default: "greeting" },
  updatedAt: { type: Date, default: Date.now },
});

export const Conversation = model<IConversation>("Conversation", ConversationSchema);