import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/Product";
import { Customer } from "../models/Customer";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { Conversation } from "../models/Conversation";
import { Counter } from "../models/Counter";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Conectado a MongoDB");

    // --- LIMPIAR COLECCIONES ---
    await Promise.all([
      Product.deleteMany(),
      Customer.deleteMany(),
      Order.deleteMany(),
      Payment.deleteMany(),
      Conversation.deleteMany(),
      Counter.deleteMany(), // importante para resetear el autoincremental
    ]);
    console.log("🧹 Colecciones limpiadas");

    // --- INSERTAR PRODUCTOS ---
    const products = await Product.insertMany([
      {
        name: "Auriculares Bluetooth JBL Tune 510BT",
        description: "Auriculares inalámbricos con hasta 40 horas de batería. Sonido JBL Pure Bass.",
        price: 249.9,
        category: "Tecnología",
        stock: 15,
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/61d5F7xRZcL._AC_SL1500_.jpg",
      },
      {
        name: "Teclado Mecánico Redragon Kumara K552",
        description: "Retroiluminado RGB, switches Outemu Blue, ideal para gaming.",
        price: 189.9,
        category: "Tecnología",
        stock: 10,
        imageUrl: "https://m.media-amazon.com/images/I/71l9N8eN6BL._AC_SL1500_.jpg",
      },
      {
        name: "Mouse Gamer Logitech G203",
        description: "Sensor de 8000 DPI con RGB LIGHTSYNC y diseño ergonómico.",
        price: 99.9,
        category: "Tecnología",
        stock: 20,
        imageUrl: "https://m.media-amazon.com/images/I/61LUYk0sBPL._AC_SL1500_.jpg",
      },
      {
        name: "Smartwatch Amazfit Bip U Pro",
        description: "Monitoreo de oxígeno, GPS integrado y resistencia al agua 5 ATM.",
        price: 299.9,
        category: "Tecnología",
        stock: 12,
        imageUrl: "https://m.media-amazon.com/images/I/61gscZYmaoL._AC_SL1500_.jpg",
      },
      {
        name: "Parlante Bluetooth Anker Soundcore 2",
        description: "Sonido estéreo de 12W con 24 horas de reproducción continua.",
        price: 179.9,
        category: "Tecnología",
        stock: 8,
        imageUrl: "https://m.media-amazon.com/images/I/71rXSVqET9L._AC_SL1500_.jpg",
      },
    ]);
    console.log(`📦 ${products.length} productos insertados`);

    // --- INSERTAR CLIENTES ---
    const customers = await Customer.insertMany([
      {
        phone: "999111222",
        name: "Carlos Mendoza",
        email: "carlos.mendoza@example.com",
        address: "Av. Primavera 123, Lima",
        totalOrders: 2,
        totalSpent: 439.8,
      },
      {
        phone: "988555333",
        name: "María Torres",
        email: "maria.torres@example.com",
        address: "Jr. Puno 456, Cusco",
        totalOrders: 1,
        totalSpent: 249.9,
      },
      {
        phone: "977444111",
        name: "Luis Ramírez",
        email: "luis.ramirez@example.com",
        address: "Calle Los Álamos 88, Arequipa",
        totalOrders: 0,
        totalSpent: 0,
      },
    ]);
    console.log(`👥 ${customers.length} clientes insertados`);

    // --- INSERTAR PEDIDOS ---
    const order1 = new Order({
      customerId: customers[0]._id,
      customerPhone: customers[0].phone,
      items: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          quantity: 1,
          price: products[0].price,
        },
        {
          productId: products[2]._id,
          productName: products[2].name,
          quantity: 2,
          price: products[2].price,
        },
      ],
      totalAmount: 249.9 + 99.9 * 2,
      status: "delivered",
      paymentStatus: "paid",
      deliveryAddress: customers[0].address,
      notes: "Entregar en horario de oficina.",
    });
    await order1.save(); // Ejecuta el pre-save y genera el número autoincremental

    const order2 = new Order({
      customerId: customers[1]._id,
      customerPhone: customers[1].phone,
      items: [
        {
          productId: products[1]._id,
          productName: products[1].name,
          quantity: 1,
          price: products[1].price,
        },
      ],
      totalAmount: 189.9,
      status: "preparing",
      paymentStatus: "pending",
      deliveryAddress: customers[1].address,
      notes: "Confirmar antes de enviar.",
    });
    await order2.save();

    console.log(`🧾 2 pedidos insertados correctamente (${order1.orderNumber}, ${order2.orderNumber})`);

    // --- INSERTAR PAGOS ---
    const payments = await Payment.insertMany([
      {
        orderId: order1._id,
        orderNumber: order1.orderNumber,
        customerId: customers[0]._id,
        amount: order1.totalAmount,
        gateway: "culqi",
        culqiOrderId: "CULQI-ORDER-001",
        checkoutUrl: "https://pago.culqi.com/checkout/CULQI-ORDER-001",
        method: "card",
        status: "completed",
        transactionId: "TXN123456",
        receiptUrl: "https://www.culqi.com/recibo/TXN123456",
      },
      {
        orderId: order2._id,
        orderNumber: order2.orderNumber,
        customerId: customers[1]._id,
        amount: order2.totalAmount,
        gateway: "culqi",
        culqiOrderId: "CULQI-ORDER-002",
        checkoutUrl: "https://pago.culqi.com/checkout/CULQI-ORDER-002",
        method: "billetera_movil",
        status: "pending",
        transactionId: "TXN789101",
      },
    ]);
    console.log(`💰 ${payments.length} pagos insertados`);

    // --- INSERTAR CONVERSACIONES ---
    const conversations = await Conversation.insertMany([
      {
        phone: customers[0].phone,
        cart: [
          {
            productId: products[0]._id,
            productName: products[0].name,
            quantity: 1,
            price: products[0].price,
          },
        ],
        lastMessage: "Gracias por su compra, su pedido ha sido entregado ✅",
        currentStep: "completed",
        updatedAt: new Date(),
      },
      {
        phone: customers[1].phone,
        cart: [
          {
            productId: products[1]._id,
            productName: products[1].name,
            quantity: 1,
            price: products[1].price,
          },
        ],
        lastMessage: "Su pedido está en preparación 🍳",
        currentStep: "follow_up",
        updatedAt: new Date(),
      },
    ]);
    console.log(`💬 ${conversations.length} conversaciones insertadas`);

    console.log("🎉 Seed ejecutado correctamente ✅");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error);
    process.exit(1);
  }
})();
