import express from "express";
import { Product } from "../models/Product";

const router = express.Router();

router.get("/", async (_, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post("/", async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

export default router;
