// src/routes/culqi.routes.ts
import { Router } from "express";
import {
  createCulqiOrder,
  createCulqiCharge,
  confirmCulqiOrder,
  handleCulqiWebhook,
  getCulqiOrderStatus,
  getPaymentById,
} from "../controllers/culqi.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Culqi
 *   description: Endpoints para integración con la pasarela de pagos Culqi
 */

/**
 * @swagger
 * /api/culqi/create-order:
 *   post:
 *     summary: Crea una orden de pago en Culqi
 *     tags: [Culqi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 example: PEN
 *               customerEmail:
 *                 type: string
 *               method:
 *                 type: string
 *                 example: card
 *     responses:
 *       201:
 *         description: Orden creada correctamente
 */
router.post("/create-order", createCulqiOrder);

/**
 * @swagger
 * /api/culqi/create-charge:
 *   post:
 *     summary: Crea un cargo directo (pago inmediato con token)
 *     tags: [Culqi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cargo creado exitosamente
 */
router.post("/create-charge", createCulqiCharge);

/**
 * @swagger
 * /api/culqi/confirm-order:
 *   post:
 *     summary: Confirma el estado del pago en Culqi
 *     tags: [Culqi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               culqiOrderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado de pago actualizado
 */
router.post("/confirm-order", confirmCulqiOrder);

/**
 * @swagger
 * /api/culqi/webhook:
 *   post:
 *     summary: Recibe notificaciones automáticas desde Culqi
 *     tags: [Culqi]
 *     responses:
 *       200:
 *         description: Webhook procesado correctamente
 */
router.post("/webhook", handleCulqiWebhook);

/**
 * @swagger
 * /api/culqi/order/{culqiOrderId}:
 *   get:
 *     summary: Obtiene el estado de una orden en Culqi
 *     tags: [Culqi]
 *     parameters:
 *       - in: path
 *         name: culqiOrderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden en Culqi
 *     responses:
 *       200:
 *         description: Detalle de la orden
 */
router.get("/order/:culqiOrderId", getCulqiOrderStatus);

/**
 * @swagger
 * /api/culqi/payment/{paymentId}:
 *   get:
 *     summary: Obtiene el detalle de un pago desde la base de datos
 *     tags: [Culqi]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago en tu base de datos
 *     responses:
 *       200:
 *         description: Detalle del pago
 */
router.get("/payment/:paymentId", getPaymentById);

export default router;
