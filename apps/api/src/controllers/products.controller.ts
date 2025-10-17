import { Request, Response } from "express";
import { Product } from "../models/Product";

// GET /api/products - Obtener todos los productos activos
export const getProducts = async (_: Request, res: Response) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos", error });
  }
};

// GET /api/products/search?q=&category=
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category } = req.query;
    const query: any = {};

    if (q) query.name = { $regex: q, $options: "i" };
    if (category) query.category = category;

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error en la búsqueda", error });
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener producto", error });
  }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: "Error al crear producto", error });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar producto", error });
  }
};

// DELETE /api/products/:id (soft delete)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado", product });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto", error });
  }
};
