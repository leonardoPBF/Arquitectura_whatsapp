import { Router } from "express";
import { exportOrders, exportOrdersCSV } from "../controllers/sheets.controller";

const router = Router();

/**
 * @swagger
 * /api/sheets/export:
 *   get:
 *     summary: Exportar órdenes a Google Sheets
 *     tags: [Sheets]
 *     responses:
 *       200:
 *         description: Datos preparados para exportación
 */
router.get("/export", exportOrders);

/**
 * @swagger
 * /api/sheets/export/csv:
 *   get:
 *     summary: Exportar órdenes a CSV
 *     tags: [Sheets]
 *     responses:
 *       200:
 *         description: Archivo CSV generado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get("/export/csv", exportOrdersCSV);

export default router