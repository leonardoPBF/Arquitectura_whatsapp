import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import productsRoutes from "./routes/products.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_, res) => res.send("API funcionando 🚀"));
app.use("/api/products", productsRoutes);

export default app;
