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

// GET /api/conversations/:phone/cart
export const getConversationCart = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const conversation = await Conversation.findOne({ phone });
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });
    res.json({ cart: conversation.cart });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener carrito", error });
  }
};

// POST /api/conversations/:phone/cart/add
export const addItemToConversationCart = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { productId, productName, quantity = 1, price = 0 } = req.body;

    if (!productId) return res.status(400).json({ message: "productId requerido" });

    const conversation = await Conversation.findOne({ phone });
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });

    const existing = conversation.cart.find((c: any) => c.productId?.toString() === productId.toString());
    if (existing) {
      existing.quantity += quantity;
      existing.price = price ?? existing.price;
      existing.productName = productName ?? existing.productName;
    } else {
      conversation.cart.push({ productId, productName, quantity, price });
    }

  conversation.updatedAt = new Date();
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ message: "Error al agregar item al carrito", error });
  }
};

// POST /api/conversations/:phone/cart/remove
export const removeItemFromConversationCart = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { productId, quantity } = req.body;

    if (!productId) return res.status(400).json({ message: "productId requerido" });

    const conversation = await Conversation.findOne({ phone });
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });

    const idx = conversation.cart.findIndex((c: any) => c.productId?.toString() === productId.toString());
    if (idx === -1) return res.status(404).json({ message: "Producto no encontrado en el carrito" });

    if (quantity && quantity > 0) {
      // reducir cantidad
      conversation.cart[idx].quantity -= quantity;
      if (conversation.cart[idx].quantity <= 0) {
        conversation.cart.splice(idx, 1);
      }
    } else {
      // eliminar item completamente
      conversation.cart.splice(idx, 1);
    }

  conversation.updatedAt = new Date();
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ message: "Error al remover item del carrito", error });
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
    console.log(`[clearConversationCart] request params:`, req.params);
    const { phone } = req.params;
    const conversation = await Conversation.findOneAndUpdate(
      { phone },
      { cart: [], updatedAt: Date.now() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });
    console.log(`[clearConversationCart] cleared cart for phone=${phone}`);
    res.json({ message: "Carrito vaciado", conversation });
  } catch (error) {
    console.error("[clearConversationCart] error:", error);
    res.status(500).json({ message: "Error al vaciar carrito", error });
  }
};
