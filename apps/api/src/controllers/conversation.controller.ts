import { Request, Response } from "express";
import { Conversation } from "../models/Conversation";

// GET /api/conversations
export const getConversations = async (_: Request, res: Response) => {
  try {
    const conversations = await Conversation.find();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener conversaciones", error });
  }
};

// GET /api/conversations/:phone
export const getConversationByPhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const conversation = await Conversation.findOne({ phone });
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener conversación", error });
  }
};

// POST /api/conversations
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    let conversation = await Conversation.findOne({ phone });
    if (!conversation) {
      conversation = new Conversation({ phone });
      await conversation.save();
    }
    res.status(201).json(conversation);
  } catch (error) {
    res.status(400).json({ message: "Error al crear conversación", error });
  }
};

// PATCH /api/conversations/:phone/cart
export const updateConversationCart = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { cart } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
      { phone },
      { cart, updatedAt: Date.now() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar carrito", error });
  }
};

// PATCH /api/conversations/:phone/step
export const updateConversationStep = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { currentStep, lastMessage } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
      { phone },
      { currentStep, lastMessage, updatedAt: Date.now() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar paso", error });
  }
};

// DELETE /api/conversations/:phone/cart
export const clearConversationCart = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const conversation = await Conversation.findOneAndUpdate(
      { phone },
      { cart: [], updatedAt: Date.now() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });
    res.json({ message: "Carrito vaciado", conversation });
  } catch (error) {
    res.status(500).json({ message: "Error al vaciar carrito", error });
  }
};
