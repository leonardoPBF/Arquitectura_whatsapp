import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { rateLimit } from 'express-rate-limit';
import { securityGate } from './middlewares/security';

import productsRoutes from "./routes/products.routes";
import ordersRoutes from "./routes/orders.routes";
import customersRoutes from "./routes/customers.routes";
import paymentsRoutes from "./routes/payments.routes";
import conversationRoutes from "./routes/conversation.routes";
import sheetsRoutes from "./routes/sheets.routes";
import culqiRoutes from "./routes/culqi.routes";
import chatbotRoutes from "./routes/chatbot.routes";
import authRoutes from "./routes/auth.routes";
import { setupSwagger } from "./config/swagger";

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()).filter(Boolean) || [
    "http://localhost:5173",
    "http://localhost:5005",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(morgan("dev"));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api', securityGate);
app.use('/api/chatbot', rateLimit({ windowMs: 60_000, limit: 30,
  keyGenerator: (_req, res) => res.locals.principal.id, standardHeaders: 'draft-8', legacyHeaders: false }));


setupSwagger(app);

app.get("/", (_, res) => res.send("🚀 API WhatsApp Sales funcionando"));
app.get('/health/live', (_, res) => res.json({ status: 'up' }));
app.get('/health/ready', (_, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ready' : 'not-ready' });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/sheets", sheetsRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/culqi", culqiRoutes);
app.use("/api/chatbot",chatbotRoutes);

export default app;
