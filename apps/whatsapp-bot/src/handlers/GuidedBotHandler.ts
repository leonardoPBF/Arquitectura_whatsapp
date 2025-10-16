// import { Client, Message, Buttons, List } from 'whatsapp-web.js';
// import { Conversation, Product, Order, Customer } from '../models';

// export class GuidedBotHandler {
//   private client: Client;

//   constructor(client: Client) {
//     this.client = client;
//   }

//   async handleMessage(msg: Message) {
//     const phone = msg.from;
    
//     // Obtener o crear conversación
//     let conversation = await Conversation.findOne({ phone });
//     if (!conversation) {
//       conversation = await Conversation.create({
//         phone,
//         step: 'welcome',
//         cart: [],
//       });
//     }

//     // Actualizar última actividad
//     conversation.lastMessageAt = new Date();

//     // Procesar según el paso actual
//     switch (conversation.step) {
//       case 'welcome':
//         await this.sendWelcome(msg, conversation);
//         break;

//       case 'browsing':
//         await this.handleBrowsing(msg, conversation);
//         break;

//       case 'viewing_product':
//         await this.handleProductView(msg, conversation);
//         break;

//       case 'adding_to_cart':
//         await this.handleAddToCart(msg, conversation);
//         break;

//       case 'viewing_cart':
//         await this.handleCartView(msg, conversation);
//         break;

//       case 'checkout':
//         await this.handleCheckout(msg, conversation);
//         break;

//       case 'awaiting_address':
//         await this.handleAddress(msg, conversation);
//         break;

//       case 'payment_method':
//         await this.handlePaymentMethod(msg, conversation);
//         break;

//       case 'awaiting_yape_proof':
//         await this.handleYapeProof(msg, conversation);
//         break;

//       case 'completed':
//         await this.handleCompleted(msg, conversation);
//         break;

//       default:
//         await this.sendWelcome(msg, conversation);
//     }

//     await conversation.save();
//   }

//   // ==========================================
//   // PASO 1: BIENVENIDA
//   // ==========================================
//   async sendWelcome(msg: Message, conversation: any) {
//     const buttons = new Buttons(
//       '👋 *¡Bienvenido a nuestra tienda!*\n\n' +
//       '¿Qué te gustaría hacer hoy?',
//       [
//         { body: '🛍️ Ver catálogo' },
//         { body: '🛒 Mi carrito' },
//         { body: '📦 Mis pedidos' }
//       ],
//       '¡Elige una opción!'
//     );

//     await this.client.sendMessage(msg.from, buttons);
//     conversation.step = 'browsing';
//   }

//   // ==========================================
//   // PASO 2: NAVEGACIÓN (con Listas)
//   // ==========================================
//   async handleBrowsing(msg: Message, conversation: any) {
//     const text = msg.body.toLowerCase();

//     if (text.includes('catálogo') || text.includes('catalogo')) {
//       await this.sendCatalogCategories(msg);
//     } else if (text.includes('carrito')) {
//       conversation.step = 'viewing_cart';
//       await this.showCart(msg, conversation);
//     } else if (text.includes('pedidos')) {
//       await this.showOrders(msg, conversation);
//     } else {
//       // Si el usuario escribe algo diferente, volver a mostrar opciones
//       await this.sendWelcome(msg, conversation);
//     }
//   }

//   // Enviar categorías como Lista
//   async sendCatalogCategories(msg: Message) {
//     const categories = await this.getCategories();

//     const sections = categories.map(cat => ({
//       title: cat.name,
//       rows: [
//         {
//           id: `cat_${cat.slug}`,
//           title: `Ver ${cat.name}`,
//           description: `${cat.productCount} productos disponibles`
//         }
//       ]
//     }));

//     const list = new List(
//       '🛍️ *CATÁLOGO DE PRODUCTOS*\n\n' +
//       'Selecciona una categoría para ver los productos:',
//       'Ver categorías',
//       sections,
//       '¡Elige una categoría!'
//     );

//     await this.client.sendMessage(msg.from, list);
//   }

//   // ==========================================
//   // PASO 3: VER PRODUCTOS DE UNA CATEGORÍA
//   // ==========================================
//   async handleProductView(msg: Message, conversation: any) {
//     // Usuario seleccionó una categoría desde la lista
//     const selectedId = msg.selectedRowId || msg.body;

//     if (selectedId.startsWith('cat_')) {
//       const categorySlug = selectedId.replace('cat_', '');
//       await this.sendProductsInCategory(msg, categorySlug, conversation);
//     } else if (selectedId.startsWith('prod_')) {
//       const productId = selectedId.replace('prod_', '');
//       await this.sendProductDetails(msg, productId, conversation);
//     } else {
//       // Volver al menú
//       await this.sendWelcome(msg, conversation);
//     }
//   }

//   // Enviar productos de una categoría
//   async sendProductsInCategory(msg: Message, category: string, conversation: any) {
//     const products = await Product.find({ 
//       categories: category,
//       isActive: true,
//       stock: { $gt: 0 }
//     }).limit(10);

//     if (products.length === 0) {
//       await msg.reply('No hay productos disponibles en esta categoría.');
//       await this.sendWelcome(msg, conversation);
//       return;
//     }

//     const sections = [{
//       title: 'Productos disponibles',
//       rows: products.map(p => ({
//         id: `prod_${p._id}`,
//         title: p.name,
//         description: `S/ ${p.price} - Stock: ${p.stock}`
//       }))
//     }];

//     // Agregar opción para volver
//     sections.push({
//       title: 'Otras opciones',
//       rows: [
//         {
//           id: 'back_categories',
//           title: '⬅️ Volver a categorías',
//           description: 'Ver otras categorías'
//         },
//         {
//           id: 'view_cart',
//           title: '🛒 Ver mi carrito',
//           description: `${conversation.cart?.length || 0} productos`
//         }
//       ]
//     });

//     const list = new List(
//       `📦 *Productos en ${category}*\n\n` +
//       'Selecciona un producto para ver detalles:',
//       'Ver productos',
//       sections,
//       'Catálogo'
//     );

//     await this.client.sendMessage(msg.from, list);
//     conversation.step = 'viewing_product';
//   }

//   // Detalles de producto con botones
//   async sendProductDetails(msg: Message, productId: string, conversation: any) {
//     const product = await Product.findById(productId);

//     if (!product) {
//       await msg.reply('Producto no encontrado.');
//       return;
//     }

//     // Guardar producto actual en conversación
//     conversation.tempData = { currentProductId: productId };

//     let message = `📦 *${product.name}*\n\n`;
//     message += `${product.description}\n\n`;
//     message += `💰 *Precio:* S/ ${product.price}\n`;
//     message += `📦 *Stock:* ${product.stock} unidades\n`;
    
//     if (product.images && product.images.length > 0) {
//       // Enviar imagen primero
//       await this.client.sendMessage(msg.from, product.images[0]);
//     }

//     const buttons = new Buttons(
//       message,
//       [
//         { body: '➕ Agregar 1' },
//         { body: '➕ Agregar 2' },
//         { body: '📝 Cantidad personalizada' }
//       ],
//       'Agregar al carrito'
//     );

//     await this.client.sendMessage(msg.from, buttons);
//     conversation.step = 'adding_to_cart';
//   }

//   // ==========================================
//   // PASO 4: AGREGAR AL CARRITO
//   // ==========================================
//   async handleAddToCart(msg: Message, conversation: any) {
//     const text = msg.body.toLowerCase();
//     const productId = conversation.tempData?.currentProductId;

//     if (!productId) {
//       await msg.reply('Error: producto no encontrado. Vuelve a seleccionar.');
//       conversation.step = 'browsing';
//       return;
//     }

//     let quantity = 1;

//     if (text.includes('agregar 1')) {
//       quantity = 1;
//     } else if (text.includes('agregar 2')) {
//       quantity = 2;
//     } else if (text.includes('personalizada')) {
//       await msg.reply('¿Cuántas unidades quieres agregar? (escribe un número del 1 al 10)');
//       conversation.step = 'awaiting_quantity';
//       return;
//     } else if (!isNaN(Number(text))) {
//       quantity = Math.min(Math.max(parseInt(text), 1), 10);
//     }

//     await this.addToCart(msg, conversation, productId, quantity);
//   }

//   async addToCart(msg: Message, conversation: any, productId: string, quantity: number) {
//     const product = await Product.findById(productId);

//     if (!product || product.stock < quantity) {
//       await msg.reply(`❌ No hay suficiente stock. Solo hay ${product?.stock || 0} unidades.`);
//       return;
//     }

//     // Verificar si ya existe en el carrito
//     const existingItem = conversation.cart.find((item: any) => 
//       item.productId.toString() === productId
//     );

//     if (existingItem) {
//       existingItem.quantity += quantity;
//     } else {
//       conversation.cart.push({
//         productId: product._id,
//         name: product.name,
//         price: product.price,
//         quantity,
//       });
//     }

//     await conversation.save();

//     const buttons = new Buttons(
//       `✅ *${product.name}* agregado al carrito\n\n` +
//       `Cantidad: ${quantity}\n` +
//       `Subtotal: S/ ${(product.price * quantity).toFixed(2)}\n\n` +
//       `¿Qué deseas hacer?`,
//       [
//         { body: '🛍️ Seguir comprando' },
//         { body: '🛒 Ver carrito' },
//         { body: '💳 Proceder al pago' }
//       ],
//       'Carrito'
//     );

//     await this.client.sendMessage(msg.from, buttons);
//     conversation.step = 'viewing_cart';
//   }

//   // ==========================================
//   // PASO 5: VER CARRITO
//   // ==========================================
//   async showCart(msg: Message, conversation: any) {
//     if (!conversation.cart || conversation.cart.length === 0) {
//       const buttons = new Buttons(
//         '🛒 Tu carrito está vacío\n\n¿Quieres explorar productos?',
//         [{ body: '🛍️ Ver catálogo' }],
//         'Carrito vacío'
//       );
//       await this.client.sendMessage(msg.from, buttons);
//       conversation.step = 'browsing';
//       return;
//     }

//     let total = 0;
//     let cartText = '🛒 *TU CARRITO*\n\n';

//     conversation.cart.forEach((item: any) => {
//       const subtotal = item.price * item.quantity;
//       total += subtotal;
//       cartText += `• ${item.name}\n`;
//       cartText += `  ${item.quantity} x S/ ${item.price} = S/ ${subtotal.toFixed(2)}\n\n`;
//     });

//     cartText += `\n💰 *TOTAL: S/ ${total.toFixed(2)}*\n\n`;
//     cartText += '¿Qué deseas hacer?';

//     const buttons = new Buttons(
//       cartText,
//       [
//         { body: '🛍️ Seguir comprando' },
//         { body: '🗑️ Vaciar carrito' },
//         { body: '✅ Proceder al pago' }
//       ],
//       'Carrito'
//     );

//     await this.client.sendMessage(msg.from, buttons);
//     conversation.step = 'checkout';
//   }

//   // ==========================================
//   // PASO 6: CHECKOUT
//   // ==========================================
//   async handleCheckout(msg: Message, conversation: any) {
//     const text = msg.body.toLowerCase();

//     if (text.includes('seguir comprando') || text.includes('catálogo')) {
//       conversation.step = 'browsing';
//       await this.sendCatalogCategories(msg);
//     } else if (text.includes('vaciar')) {
//       conversation.cart = [];
//       await conversation.save();
//       await msg.reply('🗑️ Carrito vaciado.');
//       await this.sendWelcome(msg, conversation);
//     } else if (text.includes('pago') || text.includes('proceder')) {
//       conversation.step = 'awaiting_address';
//       await msg.reply(
//         '📍 *Dirección de envío*\n\n' +
//         'Por favor, escribe tu dirección completa para el envío.\n\n' +
//         '_Ejemplo: Jr. Las Flores 123, San Isidro, Lima_'
//       );
//     }
//   }

//   // ==========================================
//   // PASO 7: DIRECCIÓN
//   // ==========================================
//   async handleAddress(msg: Message, conversation: any) {
//     const address = msg.body.trim();

//     if (address.length < 10) {
//       await msg.reply('⚠️ Por favor, escribe una dirección completa.');
//       return;
//     }

//     conversation.tempData = {
//       ...conversation.tempData,
//       address,
//     };

//     const total = conversation.cart.reduce((sum: number, item: any) => 
//       sum + (item.price * item.quantity), 0
//     );

//     const buttons = new Buttons(
//       `✅ Dirección guardada\n\n` +
//       `📍 ${address}\n\n` +
//       `💰 Total a pagar: S/ ${total.toFixed(2)}\n\n` +
//       `Selecciona tu método de pago:`,
//       [
//         { body: '💳 Tarjeta (Culqi)' },
//         { body: '📱 Yape' },
//         { body: '💵 Pago en efectivo' }
//       ],
//       'Método de pago'
//     );

//     await this.client.sendMessage(msg.from, buttons);
//     conversation.step = 'payment_method';
//   }

//   // ==========================================
//   // PASO 8: MÉTODO DE PAGO
//   // ==========================================
//   async handlePaymentMethod(msg: Message, conversation: any) {
//     const text = msg.body.toLowerCase();

//     // Crear orden primero
//     const order = await this.createOrder(conversation);

//     if (text.includes('tarjeta') || text.includes('culqi')) {
//       await this.sendCulqiLink(msg, conversation, order);
//     } else if (text.includes('yape')) {
//       await this.requestYapeProof(msg, conversation, order);
//     } else if (text.includes('efectivo')) {
//       await this.handleCashPayment(msg, conversation, order);
//     }
//   }

//   async createOrder(conversation: any): Promise<any> {
//     const customer = await Customer.findOneAndUpdate(
//       { phone: conversation.phone },
//       { phone: conversation.phone, lastInteraction: new Date() },
//       { upsert: true, new: true }
//     );

//     const total = conversation.cart.reduce((sum: number, item: any) => 
//       sum + (item.price * item.quantity), 0
//     );

//     const order = await Order.create({
//       orderNumber: `ORD-${Date.now()}`,
//       customer: customer._id,
//       items: conversation.cart,
//       total,
//       currency: 'PEN',
//       status: 'pending',
//       payment: {
//         status: 'processing'
//       }
//     });

//     conversation.tempData = {
//       ...conversation.tempData,
//       orderId: order._id.toString()
//     };

//     return order;
//   }

//   async sendCulqiLink(msg: Message, conversation: any, order: any) {
//     // Aquí integrarías con Culqi
//     const paymentLink = `https://checkout.culqi.com/...`;

//     await msg.reply(
//       `💳 *Link de pago generado*\n\n` +
//       `Pedido: ${order.orderNumber}\n` +
//       `Monto: S/ ${order.total.toFixed(2)}\n\n` +
//       `${paymentLink}\n\n` +
//       `Haz clic en el link para pagar de forma segura.`
//     );

//     conversation.step = 'completed';
//   }

//   async requestYapeProof(msg: Message, conversation: any, order: any) {
//     await msg.reply(
//       `📱 *Pago con Yape*\n\n` +
//       `Pedido: ${order.orderNumber}\n` +
//       `Monto: S/ ${order.total.toFixed(2)}\n\n` +
//       `Realiza tu Yape al número: *999 999 999*\n\n` +
//       `Luego envía la captura de pantalla del comprobante.`
//     );

//     conversation.step = 'awaiting_yape_proof';
//   }

//   async handleCashPayment(msg: Message, conversation: any, order: any) {
//     order.payment.method = 'cash';
//     order.status = 'confirmed';
//     await order.save();

//     await msg.reply(
//       `✅ *Pedido confirmado*\n\n` +
//       `Pedido: ${order.orderNumber}\n` +
//       `Total: S/ ${order.total.toFixed(2)}\n` +
//       `Pago: Efectivo contra entrega\n\n` +
//       `Tu pedido será entregado en 24-48 horas.\n` +
//       `Te notificaremos cuando esté en camino.`
//     );

//     conversation.cart = [];
//     conversation.step = 'completed';
//   }

//   // ==========================================
//   // PASO 9: RECIBIR COMPROBANTE YAPE
//   // ==========================================
//   async handleYapeProof(msg: Message, conversation: any) {
//     if (!msg.hasMedia) {
//       await msg.reply('Por favor, envía la imagen del comprobante de Yape.');
//       return;
//     }

//     const media = await msg.downloadMedia();
//     // Guardar imagen y marcar orden como pendiente de verificación

//     const orderId = conversation.tempData?.orderId;
//     const order = await Order.findById(orderId);

//     if (order) {
//       order.payment.method = 'yape';
//       order.payment.status = 'pending_verification';
//       // Aquí guardarías la imagen en S3/Cloudinary
//       await order.save();
//     }

//     await msg.reply(
//       `✅ Comprobante recibido\n\n` +
//       `Estamos verificando tu pago. Te confirmaremos en los próximos minutos.\n\n` +
//       `Número de pedido: ${order?.orderNumber}`
//     );

//     conversation.cart = [];
//     conversation.step = 'completed';
//   }

//   // ==========================================
//   // HELPERS
//   // ==========================================
//   async handleCompleted(msg: Message, conversation: any) {
//     await this.sendWelcome(msg, conversation);
//   }

//   async showOrders(msg: Message, conversation: any) {
//     const customer = await Customer.findOne({ phone: conversation.phone });
//     if (!customer) {
//       await msg.reply('No tienes pedidos anteriores.');
//       return;
//     }

//     const orders = await Order.find({ customer: customer._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     if (orders.length === 0) {
//       await msg.reply('No tienes pedidos anteriores.');
//       return;
//     }

//     let ordersText = '📦 *TUS ÚLTIMOS PEDIDOS*\n\n';
//     orders.forEach(order => {
//       ordersText += `• ${order.orderNumber}\n`;
//       ordersText += `  S/ ${order.total.toFixed(2)} - ${order.status}\n`;
//       ordersText += `  ${order.createdAt.toLocaleDateString()}\n\n`;
//     });

//     await msg.reply(ordersText);
//   }

//   async getCategories() {
//     const products = await Product.find({ isActive: true });
//     const categoriesMap = new Map();

//     products.forEach(p => {
//       p.categories.forEach((cat: string) => {
//         if (!categoriesMap.has(cat)) {
//           categoriesMap.set(cat, { name: cat, slug: cat.toLowerCase(), productCount: 0 });
//         }
//         categoriesMap.get(cat).productCount++;
//       });
//     });

//     return Array.from(categoriesMap.values());
//   }
// }