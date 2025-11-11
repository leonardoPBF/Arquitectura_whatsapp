import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import productsRoutes from "./routes/products.routes";
import ordersRoutes from "./routes/orders.routes";
import customersRoutes from "./routes/customers.routes";
import paymentsRoutes from "./routes/payments.routes";
import conversationRoutes from "./routes/conversation.routes";
import sheetsRoutes from "./routes/sheets.routes";
import culqiRoutes from "./routes/culqi.routes";
import chatbotRoutes from "./routes/chatbot.routes";
import { setupSwagger } from "./config/swagger";

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5005",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(morgan("dev"));


setupSwagger(app);

app.get("/", (_, res) => res.send("🚀 API WhatsApp Sales funcionando"));

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/sheets", sheetsRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/culqi", culqiRoutes);
app.use("/api/chatbot",chatbotRoutes);

export default app;
