import { Router } from "express";
import {
  getConversations,
  getConversationByPhone,
  createConversation,
  updateConversationCart,
  updateConversationStep,
  clearConversationCart,
} from "../controllers/conversation.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       required:
 *         - phone
 *       properties:
 *         _id:
 *           type: string
 *         phone:
 *           type: string
 *         cart:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               productName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *         lastMessage:
 *           type: string
 *         currentStep:
 *           type: string
 *           enum: [greeting, awaiting_email, main_menu, adding_items, awaiting_confirmation, awaiting_payment_webhook]
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Obtener todas las conversaciones
 *     tags: [Conversations]
 *     responses:
 *       200:
 *         description: Lista de conversaciones activas
 */
router.get("/", getConversations);

/**
 * @swagger
 * /api/conversations/{phone}:
 *   get:
 *     summary: Obtener conversación por número de teléfono
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversación encontrada
 *       404:
 *         description: Conversación no encontrada
 */
router.get("/:phone", getConversationByPhone);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Crea una nueva conversación o devuelve la existente
 *     tags: [Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "51987654321"
 *                 description: Número de teléfono del cliente (incluyendo código de país)
 *     responses:
 *       201:
 *         description: Conversación creada o encontrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "67121b4f50c8432b3c501cde"
 *                 phone:
 *                   type: string
 *                   example: "51987654321"
 *                 cart:
 *                   type: array
 *                   items:
 *                     type: object
 *                     example: { productId: "abc123", quantity: 2 }
 *                 currentStep:
 *                   type: string
 *                   example: "checkout"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Error al crear conversación
 */

router.post("/", createConversation);

/**
 * @swagger
 * /api/conversations/{phone}/cart:
 *   patch:
 *     summary: Actualiza el carrito de una conversación
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de teléfono asociado a la conversación
 *         example: "51987654321"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cart
 *             properties:
 *               cart:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "P12345"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       200:
 *         description: Carrito actualizado correctamente
 *       404:
 *         description: Conversación no encontrada
 *       400:
 *         description: Error al actualizar carrito
 */

router.patch("/:phone/cart", updateConversationCart);

/**
 * @swagger
 * /api/conversations/{phone}/step:
 *   patch:
 *     summary: Actualizar paso actual (currentStep) de una conversación
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentStep:
 *                 type: string
 *     responses:
 *       200:
 *         description: Paso actualizado
 */
router.patch("/:phone/step", updateConversationStep);

/**
 * @swagger
 * /api/conversations/{phone}/clear-cart:
 *   post:
 *     summary: Vaciar el carrito de una conversación
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carrito limpiado exitosamente
 */
router.post("/:phone/clear-cart", clearConversationCart);

export default router;
