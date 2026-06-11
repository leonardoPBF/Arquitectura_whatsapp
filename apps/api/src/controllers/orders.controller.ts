import { Request, Response } from "express";
import { Order } from "../models/Order";
import { IProduct, Product } from "../models/Product";
import { Customer } from "../models/Customer";
import { User } from "../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// GET /api/orders
export const getOrders = async (_: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("customerId")
      .populate("items.productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener órdenes", error });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId")
      .populate("items.productId");
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener orden", error });
  }
};

// GET /api/orders/customer/:customerId
export const getOrdersByCustomer = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener órdenes del cliente", error });
  }
};

// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  try {
    let { customerId, items } = req.body;
    const { customer: customerData, deliveryAddress, shippingAddress, notes } = req.body;

    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }

    // Fallback: Si no se proporciona customerId o no existe, intentar resolver o crear un Customer
    if (!customer && customerData) {
      if (customerData.phone) {
        customer = await Customer.findOne({ phone: customerData.phone });
      }
      if (!customer && customerData.email) {
        customer = await Customer.findOne({ email: customerData.email });
      }

      // Si aún así no existe, crear un nuevo Customer
      if (!customer) {
        customer = new Customer({
          name: customerData.name || "Cliente Sin Nombre",
          email: customerData.email || "",
          phone: customerData.phone || `TEMP-${Date.now()}`,
        });
        await customer.save();
      }

      customerId = customer._id;
    }

    if (!customerId || !customer || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Vincular customerId al User si el usuario está autenticado y no tiene customerId asignado
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.userId) {
            const user = await User.findById(decoded.userId);
            if (user && !user.customerId) {
              user.customerId = customer._id;
              await user.save();
            }
          }
        } catch (err) {
          console.error("⚠️ Error linking customer to user:", err);
        }
      }
    }

    const products = await Product.find({ _id: { $in: items.map(i => i.productId) } }) as (IProduct & { _id: any })[];
    let totalAmount = 0;

    const detailedItems = items.map(item => {
      const product = products.find(p => p._id.equals(item.productId));
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      const productName = product.name;
      return { productId: product._id, productName, quantity: item.quantity, price: product.price, subtotal };
    });

    let finalDeliveryAddress = "";
    if (typeof deliveryAddress === "string") {
      finalDeliveryAddress = deliveryAddress;
    } else if (shippingAddress) {
      const { address, city, zipCode } = shippingAddress;
      finalDeliveryAddress = [address, city, zipCode].filter(Boolean).join(", ");
    }

    const order = new Order({
      customerId,
      customerPhone: customer.phone,
      items: detailedItems,
      totalAmount,
      status: "pending",
      deliveryAddress: finalDeliveryAddress || undefined,
      notes: notes || undefined,
      createdAt: new Date(),
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al crear orden", error });
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar estado", error });
  }
};

// PUT /api/orders/:id
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("customerId")
      .populate("items.productId");
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar orden", error });
  }
};

// DELETE /api/orders/:id
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json({ message: "Orden eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar orden", error });
  }
};

// POST /api/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Orden no encontrada" });
    if (order.status === "delivered")
      return res.status(400).json({ message: "No se puede cancelar una orden entregada" });

    order.status = "cancelled";
    await order.save();
    res.json({ message: "Orden cancelada", order });
  } catch (error) {
    res.status(500).json({ message: "Error al cancelar orden", error });
  }
};
