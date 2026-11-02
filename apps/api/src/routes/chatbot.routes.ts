import { Router } from "express";
import { sendMessageToRasa } from "../controllers/chatbot.controller";

const router = Router();

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Consulta el asistente administrativo (solo lectura)
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "conversation-1"
 *               message:
 *                 type: string
 *                 example: "Muéstrame los carritos activos"
 *     responses:
 *       200:
 *         description: Respuesta del chatbot
 *       401:
 *         description: Sesión ausente o inválida
 *       403:
 *         description: Se requiere administrador activo
 *       429:
 *         description: Límite de consultas alcanzado
 */
router.post("/", sendMessageToRasa);

export default router;
