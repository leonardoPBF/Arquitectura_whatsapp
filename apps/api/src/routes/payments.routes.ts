import { Router } from "express";
import { culqiWebhook, validateYape } from "../controllers/payments.controller";
const router = Router();

router.post("/culqi/webhook", culqiWebhook);
router.post("/yape/validate", validateYape);

export default router;
