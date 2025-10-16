import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import sheetsRoutes from "./routes/sheets.routes.js";
import { setupSwagger } from "./config/swagger";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

setupSwagger(app);

app.get("/", (_, res) => res.send("🚀 API WhatsApp Sales funcionando"));

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/sheets", sheetsRoutes);

export default app;
