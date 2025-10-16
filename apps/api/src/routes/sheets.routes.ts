import { Router } from "express";
import { exportOrders } from "../controllers/sheets.controller.js";
const router = Router();

router.get("/export", exportOrders);

export default router;
