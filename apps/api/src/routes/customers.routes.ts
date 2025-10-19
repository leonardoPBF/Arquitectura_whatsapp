import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerByPhone,
} from "../controllers/customers.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - phone
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *         phone:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         address:
 *           type: string
 *         totalOrders:
 *           type: number
 *         totalSpent:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get("/", getCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 */
router.get("/:id", getCustomerById);

/**
 * @swagger
 * /api/customers/phone/{phone}:
 *   get:
 *     summary: Obtener cliente por número de teléfono
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 */
router.get("/phone/:phone", getCustomerByPhone);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Registrar un nuevo cliente
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: Cliente creado
 */
router.post("/", createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Actualizar datos de un cliente
 *     tags: [Customers]
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
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 */
router.put("/:id", updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Eliminar cliente
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado
 */
router.delete("/:id", deleteCustomer);

export default router;
