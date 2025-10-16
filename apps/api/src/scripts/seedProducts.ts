import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/Product";

dotenv.config();

const products = [
  {
    name: "Auriculares Bluetooth JBL Tune 510BT",
    description: "Auriculares inalámbricos con hasta 40 horas de batería.",
    price: 249.90,
    category: "Tecnología",
    stock: 15,
    image: "https://example.com/jbl.jpg",
  },
  {
    name: "Teclado Mecánico Redragon Kumara",
    description: "Retroiluminado RGB, switches Outemu Blue.",
    price: 189.90,
    category: "Tecnología",
    stock: 10,
    image: "https://example.com/keyboard.jpg",
  },
  {
    name: "Mouse Gamer Logitech G203",
    description: "Sensor de 8000 DPI, RGB LIGHTSYNC.",
    price: 99.90,
    category: "Tecnología",
    stock: 20,
    image: "https://example.com/mouse.jpg",
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Conectado a MongoDB");

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log("🎉 Productos insertados correctamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al insertar productos:", error);
    process.exit(1);
  }
})();
