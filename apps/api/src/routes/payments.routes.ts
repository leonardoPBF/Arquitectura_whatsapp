import { Router } from "express";
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  deletePayment
} from "../controllers/payments.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - orderId
 *         - orderNumber
 *         - customerId
 *         - amount
 *         - method
 *       properties:
 *         _id:
 *           type: string
 *         orderId:
 *           type: string
 *         orderNumber:
 *           type: string
 *         customerId:
 *           type: string
 *         amount:
 *           type: number
 *         method:
 *           type: string
 *           enum: [cash, transfer, card, yape, plin]
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         transactionId:
 *           type: string
 *         receiptUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Obtener todos los pagos
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Lista de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get("/", getPayments);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Obtener pago por ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pago encontrado
 *       404:
 *         description: Pago no encontrado
 */
router.get("/:id", getPaymentById);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Registrar un nuevo pago
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Pago registrado
 */
router.post("/", createPayment);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   patch:
 *     summary: Actualizar estado de pago
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *     responses:
 *       200:
 *         description: Estado de pago actualizado
 */
router.put("/:id", updatePayment);
router.patch("/:id/status", updatePaymentStatus);
router.delete("/:id", deletePayment);

export default router;