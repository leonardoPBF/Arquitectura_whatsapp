import { Router } from "express";
import { createOrder, getOrders } from "../controllers/orders.controller.js";
const router = Router();

router.get("/", getOrders);
router.post("/", createOrder);

export default router;
