import { Router } from "express";
import { sendMessageToRasa } from "../controllers/chatbot.controller";

const router = Router();

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Envía un mensaje al bot Rasa
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *                 example: "admin_user"
 *               message:
 *                 type: string
 *                 example: "Muéstrame los carritos activos"
 *     responses:
 *       200:
 *         description: Respuesta del chatbot
 */
router.post("/", sendMessageToRasa);

export default router;
