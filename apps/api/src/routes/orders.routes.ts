import { Router } from "express";
import {
  getOrders,
  getOrderById,
  getOrdersByCustomer,
  createOrder,
  updateOrderStatus,
  cancelOrder
} from "../controllers/orders.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - customerId
 *         - customerPhone
 *         - items
 *         - totalAmount
 *       properties:
 *         _id:
 *           type: string
 *         orderNumber:
 *           type: string
 *         customerId:
 *           type: string
 *         customerPhone:
 *           type: string
 *         items:
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
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, preparing, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded]
 *         deliveryAddress:
 *           type: string
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Obtener todas las órdenes
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Lista de órdenes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get("/", getOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 */
router.get("/:id", getOrderById);

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     summary: Obtener órdenes de un cliente
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de órdenes del cliente
 */
router.get("/customer/:customerId", getOrdersByCustomer);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear una nueva orden
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Orden creada
 */
router.post("/", createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Actualizar estado de orden
 *     tags: [Orders]
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
 *                 enum: [pending, confirmed, preparing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch("/:id/status", updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orden cancelada
 *       400:
 *         description: No se puede cancelar la orden
 */
router.post("/:id/cancel", cancelOrder);

export default router;