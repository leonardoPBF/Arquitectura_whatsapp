import { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  phone: string;
  context: Record<string, any>;
  lastMessage: string;
  currentStep: string;
  updatedAt: Date;
}

const ConversationSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  context: { type: Object, default: {} },
  lastMessage: { type: String, default: "" },
  currentStep: { type: String, default: "greeting" },
  updatedAt: { type: Date, default: Date.now },
});

export const Conversation = model<IConversation>("Conversation", ConversationSchema);