import { Schema, model } from "mongoose";

const ConversationSchema = new Schema({
  phone: { type: String, required: true },
  context: { type: Object, default: {} },
  lastMessage: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

export const Conversation = model("Conversation", ConversationSchema);
