import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { Order, IOrderItem } from '../models/Order';
import { Payment } from '../models/Payment';
import { Conversation } from '../models/Conversation';
import { Counter } from '../models/Counter';

dotenv.config();

// Productos con precios realistas y variados
const productsData = [
  // Tecnología - Precios accesibles
  {
    name: 'Auriculares Bluetooth JBL Tune 510BT',
    description: 'Auriculares inalámbricos con hasta 40 horas de batería. Sonido JBL Pure Bass.',
    price: 89.90,
    category: 'Tecnología',
    stock: 25,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61d5F7xRZcL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Teclado Mecánico Redragon Kumara K552',
    description: 'Retroiluminado RGB, switches Outemu Blue, ideal para gaming.',
    price: 129.90,
    category: 'Tecnología',
    stock: 18,
    imageUrl: 'https://m.media-amazon.com/images/I/71l9N8eN6BL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Mouse Gamer Logitech G203',
    description: 'Sensor de 8000 DPI con RGB LIGHTSYNC y diseño ergonómico.',
    price: 49.90,
    category: 'Tecnología',
    stock: 30,
    imageUrl: 'https://m.media-amazon.com/images/I/61LUYk0sBPL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Smartwatch Amazfit Bip U Pro',
    description: 'Monitoreo de oxígeno, GPS integrado y resistencia al agua 5 ATM.',
    price: 199.90,
    category: 'Tecnología',
    stock: 15,
    imageUrl: 'https://m.media-amazon.com/images/I/61gscZYmaoL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Parlante Bluetooth Anker Soundcore 2',
    description: 'Sonido estéreo de 12W con 24 horas de reproducción continua.',
    price: 79.90,
    category: 'Tecnología',
    stock: 20,
    imageUrl: 'https://m.media-amazon.com/images/I/71rXSVqET9L._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Webcam Logitech C920 HD Pro',
    description: 'Video Full HD 1080p, micrófono estéreo dual, corrección de luz automática.',
    price: 149.90,
    category: 'Tecnología',
    stock: 24,
    imageUrl: 'https://m.media-amazon.com/images/I/71iNwni9TsL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Cargador Inalámbrico Belkin BoostCharge',
    description: 'Carga rápida inalámbrica de 15W, compatible con iPhone y Android.',
    price: 59.90,
    category: 'Tecnología',
    stock: 32,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Batería Externa Anker PowerCore 20000',
    description: 'Batería portátil de 20000mAh, carga rápida, compatible con múltiples dispositivos.',
    price: 89.90,
    category: 'Tecnología',
    stock: 27,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  // Audio
  {
    name: 'AirPods Pro 2da Generación',
    description: 'Cancelación activa de ruido, audio espacial, resistencia al agua IPX4.',
    price: 349.90,
    category: 'Audio',
    stock: 22,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Auriculares con cancelación de ruido líder, 30 horas de batería, sonido Hi-Res.',
    price: 449.90,
    category: 'Audio',
    stock: 16,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  // Gaming
  {
    name: 'Nintendo Switch OLED',
    description: 'Pantalla OLED de 7 pulgadas, 64GB de almacenamiento, Joy-Con incluidos.',
    price: 1299.90,
    category: 'Gaming',
    stock: 11,
    imageUrl: 'https://m.media-amazon.com/images/I/61-PblYntsL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Control Xbox Series X',
    description: 'Control inalámbrico para Xbox Series X/S y PC, diseño ergonómico.',
    price: 199.90,
    category: 'Gaming',
    stock: 25,
    imageUrl: 'https://m.media-amazon.com/images/I/51wS8C9j5DL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'PlayStation 5 DualSense',
    description: 'Control inalámbrico con retroalimentación háptica y gatillos adaptativos.',
    price: 249.90,
    category: 'Gaming',
    stock: 20,
    imageUrl: 'https://m.media-amazon.com/images/I/51PBXm6xYDL._AC_SL1500_.jpg',
    isActive: true,
  },
  // Smart Home
  {
    name: 'Echo Dot 5ta Generación',
    description: 'Altavoz inteligente con Alexa, sonido mejorado, diseño esférico.',
    price: 79.90,
    category: 'Smart Home',
    stock: 35,
    imageUrl: 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg',
    isActive: true,
  },
  {
    name: 'Ring Video Doorbell Pro 2',
    description: 'Timbre inteligente con video HD, visión nocturna, detección de movimiento.',
    price: 299.90,
    category: 'Smart Home',
    stock: 13,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  // Lectura y Fitness
  {
    name: 'Kindle Paperwhite 11va Generación',
    description: 'Pantalla de 6.8 pulgadas, iluminación ajustable, resistencia al agua IPX8.',
    price: 199.90,
    category: 'Lectura',
    stock: 28,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Fitbit Charge 5',
    description: 'Monitor de actividad física, GPS integrado, monitoreo de frecuencia cardíaca.',
    price: 249.90,
    category: 'Fitness',
    stock: 19,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  // Accesorios
  {
    name: 'SSD Samsung 980 PRO 1TB',
    description: 'NVMe PCIe 4.0, velocidad de lectura hasta 7000MB/s, ideal para gaming.',
    price: 299.90,
    category: 'Almacenamiento',
    stock: 17,
    imageUrl: 'https://m.media-amazon.com/images/I/81vj2b+5KDL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Teclado Logitech MX Keys',
    description: 'Teclado inalámbrico, retroiluminado, diseño ergonómico, batería de larga duración.',
    price: 199.90,
    category: 'Periféricos',
    stock: 21,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Mouse Logitech MX Master 3S',
    description: 'Mouse inalámbrico ergonómico, sensor de alta precisión, batería de 70 días.',
    price: 179.90,
    category: 'Periféricos',
    stock: 23,
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    isActive: true,
  },
  {
    name: 'Monitor LG UltraGear 27 pulgadas',
    description: 'QHD 2560x1440, 165Hz, 1ms, G-Sync Compatible, HDR10.',
    price: 899.90,
    category: 'Monitores',
    stock: 12,
    imageUrl: 'https://m.media-amazon.com/images/I/81QpkIctqPL._AC_SL1500_.jpg',
    isActive: true,
  },
];

// Generar 65 clientes con datos variados
function generateCustomers() {
  const firstNames = [
    'Carlos', 'María', 'Luis', 'Ana', 'José', 'Laura', 'Miguel', 'Carmen',
    'Juan', 'Patricia', 'Roberto', 'Sandra', 'Fernando', 'Lucía', 'Diego',
    'Andrea', 'Ricardo', 'Mónica', 'Andrés', 'Paola', 'Javier', 'Daniela',
    'Alejandro', 'Valentina', 'Sebastián', 'Camila', 'Rodrigo', 'Natalia',
    'Gustavo', 'Isabella', 'Pablo', 'Sofía', 'Eduardo', 'Gabriela', 'Manuel',
    'Mariana', 'Francisco', 'Alejandra', 'Raúl', 'Carolina', 'Óscar', 'Andrea',
    'Héctor', 'Diana', 'Víctor', 'Claudia', 'Mario', 'Elena', 'Sergio', 'Rosa',
    'Alberto', 'Carmen', 'Jorge', 'Liliana', 'Pedro', 'Teresa', 'Rafael',
    'Beatriz', 'Antonio', 'Martha', 'Enrique', 'Silvia', 'Felipe', 'Rosa',
  ];

  const lastNames = [
    'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez',
    'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales',
    'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos', 'Mendoza', 'Herrera', 'Jiménez',
    'Ruiz', 'Vargas', 'Castro', 'Romero', 'Álvarez', 'Méndez', 'Guerrero',
    'Moreno', 'Fernández', 'Medina', 'Vásquez', 'Castro', 'Reyes', 'Ortega',
    'Delgado', 'Silva', 'Vega', 'Rojas', 'Navarro', 'Aguilar', 'Molina',
    'Suárez', 'Herrera', 'Peña', 'Soto', 'Contreras', 'Valdez', 'Campos',
  ];

  const cities = [
    'Lima', 'Cusco', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos',
    'Huancayo', 'Tacna', 'Ica', 'Pucallpa', 'Cajamarca', 'Juliaca', 'Sullana',
    'Chimbote', 'Ayacucho', 'Tumbes', 'Puno', 'Tarapoto', 'Huaraz',
  ];

  const customers = [];
  const usedPhones = new Set<string>();

  for (let i = 0; i < 65; i++) {
    let phone: string;
    do {
      phone = `9${Math.floor(Math.random() * 90000000 + 10000000)}`;
    } while (usedPhones.has(phone));
    usedPhones.add(phone);

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const address = `Av. ${lastName} ${Math.floor(Math.random() * 999 + 1)}, ${city}`;

    customers.push({
      phone,
      name,
      email,
      address,
      totalOrders: 0,
      totalSpent: 0,
    });
  }

  return customers;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Conectado a MongoDB');

    // --- PASO 1: LIMPIAR COLECCIONES ---
    await Promise.all([
      Product.deleteMany(),
      Customer.deleteMany(),
      Order.deleteMany(),
      Payment.deleteMany(),
      Conversation.deleteMany(),
      Counter.deleteMany(), // importante para resetear el autoincremental
    ]);
    console.log('🧹 Colecciones limpiadas');

    // --- PASO 2: INSERTAR PRODUCTOS ---
    const products = await Product.insertMany(productsData);
    console.log(`📦 ${products.length} productos insertados`);

    // --- PASO 3: INSERTAR CLIENTES ---
    const customersData = generateCustomers();
    const customers = await Customer.insertMany(customersData);
    console.log(`👥 ${customers.length} clientes insertados`);

    // --- PASO 4: CREAR ÓRDENES Y PAGOS ---
    const orderStatuses: Array<'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'> = [
      'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'
    ];
    const paymentMethods: Array<'card' | 'billetera_movil' | 'pagoefectivo'> = [
      'card', 'billetera_movil', 'pagoefectivo'
    ];

    const orders = [];
    const payments = [];
    const conversations = [];
    
    // Distribución de productos vendidos (para asegurar variedad)
    const productSalesCount = new Map<string, number>();
    products.forEach(p => productSalesCount.set(p._id.toString(), 0));

    // Crear órdenes para aproximadamente el 70% de los clientes
    const customersWithOrders = customers.slice(0, Math.floor(customers.length * 0.7));
    
    for (let i = 0; i < customersWithOrders.length; i++) {
      const customer = customersWithOrders[i];
      
      // Cada cliente puede tener entre 1 y 3 órdenes
      const numOrders = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numOrders; j++) {
        // Seleccionar entre 1 y 3 productos diferentes (no más de 3)
        const numItems = Math.floor(Math.random() * 3) + 1; // 1, 2 o 3 productos
        const selectedProducts: IOrderItem[] = [];
        const usedProductIds = new Set<string>();
        
        // Ordenar productos por cantidad de ventas (menos vendidos primero)
        const sortedProducts = [...products].sort((a, b) => {
          const countA = productSalesCount.get(a._id.toString()) || 0;
          const countB = productSalesCount.get(b._id.toString()) || 0;
          return countA - countB;
        });
        
        // Seleccionar productos priorizando los menos vendidos
        for (let k = 0; k < numItems && k < sortedProducts.length; k++) {
          // Buscar un producto que no esté ya seleccionado
          let product;
          let attempts = 0;
          do {
            // 70% de probabilidad de elegir de los menos vendidos, 30% aleatorio
            if (Math.random() < 0.7 && sortedProducts.length > 0) {
              const availableProducts = sortedProducts.filter(p => !usedProductIds.has(p._id.toString()));
              if (availableProducts.length > 0) {
                product = availableProducts[Math.floor(Math.random() * Math.min(5, availableProducts.length))];
              } else {
                product = products[Math.floor(Math.random() * products.length)];
              }
            } else {
              product = products[Math.floor(Math.random() * products.length)];
            }
            attempts++;
          } while (usedProductIds.has(product._id.toString()) && attempts < 20);
          
          if (product && !usedProductIds.has(product._id.toString())) {
            usedProductIds.add(product._id.toString());
            
            // Cantidad entre 1 y 3 unidades
            const quantity = Math.floor(Math.random() * 3) + 1;
            
            selectedProducts.push({
              productId: product._id as any,
              productName: product.name,
              quantity,
              price: product.price,
            });
            
            // Incrementar contador de ventas
            const currentCount = productSalesCount.get(product._id.toString()) || 0;
            productSalesCount.set(product._id.toString(), currentCount + quantity);
          }
        }

        // Si no se seleccionaron productos, saltar esta orden
        if (selectedProducts.length === 0) continue;

        const totalAmount = selectedProducts.reduce(
          (sum, item: IOrderItem) => sum + item.price * item.quantity,
          0
        );

        // Estados más realistas: más entregadas y pagadas
        const statusWeights = [0.1, 0.15, 0.15, 0.2, 0.35, 0.05]; // más delivered
        const statusIndex = Math.random() < statusWeights[0] ? 0 :
                           Math.random() < statusWeights[0] + statusWeights[1] ? 1 :
                           Math.random() < statusWeights[0] + statusWeights[1] + statusWeights[2] ? 2 :
                           Math.random() < statusWeights[0] + statusWeights[1] + statusWeights[2] + statusWeights[3] ? 3 :
                           Math.random() < statusWeights[0] + statusWeights[1] + statusWeights[2] + statusWeights[3] + statusWeights[4] ? 4 : 5;
        const status = orderStatuses[statusIndex];
        
        // Si está entregada, probablemente está pagada
        const paymentStatus = status === 'delivered' ?
          (Math.random() < 0.9 ? 'paid' : 'pending') :
          (Math.random() < 0.6 ? 'paid' : 'pending');

        const order = new Order({
          customerId: customer._id,
          customerPhone: customer.phone,
          items: selectedProducts,
          totalAmount: Math.round(totalAmount * 100) / 100, // Redondear a 2 decimales
          status,
          paymentStatus,
          deliveryAddress: customer.address,
          notes: j === 0 && Math.random() < 0.3 ? 'Entregar en horario de oficina.' : undefined,
        });
        await order.save();
        orders.push(order);

        // Crear pago asociado
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const gatewayStatus = paymentStatus === 'paid' ?
          (Math.random() < 0.9 ? 'completed' : 'pending') :
          (Math.random() < 0.3 ? 'completed' : 'pending');
        
        const payment = new Payment({
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerId: customer._id,
          amount: order.totalAmount,
          gateway: 'culqi',
          culqiOrderId: `CULQI-${order.orderNumber}-${Date.now()}-${i}-${j}`,
          checkoutUrl: `https://pago.culqi.com/checkout/CULQI-${order.orderNumber}`,
          method: paymentMethod,
          status: gatewayStatus,
          transactionId: gatewayStatus === 'completed' ? `TXN${Math.floor(Math.random() * 1000000)}` : undefined,
          receiptUrl: gatewayStatus === 'completed' ? `https://www.culqi.com/recibo/TXN${Math.floor(Math.random() * 1000000)}` : undefined,
        });
        await payment.save();
        payments.push(payment);

        // Actualizar estadísticas del cliente
        customer.totalOrders += 1;
        if (paymentStatus === 'paid') {
          customer.totalSpent += order.totalAmount;
        }
      }

      // Crear conversación para algunos clientes (30% de probabilidad)
      if (Math.random() < 0.3) {
        // Seleccionar 1-2 productos aleatorios para el carrito
        const numCartItems = Math.floor(Math.random() * 2) + 1;
        const cartProducts: IOrderItem[] = [];
        const usedCartProductIds = new Set<string>();
        
        for (let k = 0; k < numCartItems; k++) {
          let product;
          let attempts = 0;
          do {
            product = products[Math.floor(Math.random() * products.length)];
            attempts++;
          } while (usedCartProductIds.has(product._id.toString()) && attempts < 20);
          
          if (product && !usedCartProductIds.has(product._id.toString())) {
            usedCartProductIds.add(product._id.toString());
            
            cartProducts.push({
              productId: product._id as any,
              productName: product.name,
              quantity: Math.floor(Math.random() * 2) + 1, // 1 o 2 unidades
              price: product.price,
            });
          }
        }

        if (cartProducts.length > 0) {
          const lastMessages = [
            'Gracias por su compra, su pedido ha sido entregado ✅',
            'Su pedido está en preparación 🍳',
            'Su pedido ha sido enviado 📦',
            'Esperando confirmación de pago 💳',
            '¿En qué puedo ayudarte hoy?',
          ];
          const steps = ['greeting', 'browsing', 'cart', 'checkout', 'completed', 'follow_up'];

          const conversation = new Conversation({
            phone: customer.phone,
            cart: cartProducts.map((item: IOrderItem) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
            })),
            lastMessage: lastMessages[Math.floor(Math.random() * lastMessages.length)],
            currentStep: steps[Math.floor(Math.random() * steps.length)],
            updatedAt: new Date(),
          });
          await conversation.save();
          conversations.push(conversation);
        }
      }
    }

    // Actualizar clientes con sus estadísticas
    await Promise.all(customersWithOrders.map(c => c.save()));

    console.log(`🧾 ${orders.length} pedidos insertados`);
    console.log(`💰 ${payments.length} pagos insertados`);
    console.log(`💬 ${conversations.length} conversaciones insertadas`);

    // Mostrar distribución de productos vendidos
    console.log('\n📊 Distribución de productos vendidos:');
    const sortedSales = Array.from(productSalesCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [productId, count] of sortedSales) {
      const product = products.find(p => p._id.toString() === productId);
      if (product) {
        console.log(`   - ${product.name}: ${count} unidades`);
      }
    }

    console.log('\n🎉 Seed ejecutado correctamente ✅');
    console.log('\n📊 Resumen:');
    console.log(`   - Productos: ${products.length}`);
    console.log(`   - Clientes: ${customers.length}`);
    console.log(`   - Órdenes: ${orders.length}`);
    console.log(`   - Pagos: ${payments.length}`);
    console.log(`   - Conversaciones: ${conversations.length}`);
    console.log(`   - Total vendido: S/ ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar seed:', error);
    process.exit(1);
  }
})();
