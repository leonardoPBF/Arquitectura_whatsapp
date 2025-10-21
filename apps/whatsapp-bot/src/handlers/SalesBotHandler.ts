import { Client, Message } from "whatsapp-web.js";
import { api } from "../services/whatsapp.service";

interface Context {
  step: string;
  selectedProduct?: any;
  cart: Array<{ id: string; name: string; price: number; quantity: number }>;
  customerData?: { name?: string; address?: string };
}

const sessions: Record<string, Context> = {};

// =====================
// MAIN MESSAGE HANDLER
// =====================
export async function handleMessageGeneral(client: Client, msg: Message) {
  const phone = msg.from;
  const text = msg.body.trim().toLowerCase();

  // Reiniciar flujo
  if (["menu", "inicio", "volver"].includes(text)) {
    sessions[phone] = { step: "menu", cart: [] };
    return await msg.reply(getMainMenu());
  }

  // Inicializar sesión si no existe
  if (!sessions[phone]) {
    sessions[phone] = { step: "greeting", cart: [] };
  }

  const ctx = sessions[phone];
  let response = "";

  try {
    switch (ctx.step) {
      case "greeting":
        response = await handleGreeting(ctx);
        break;

      case "menu":
        response = await handleMenu(text, ctx);
        break;

      case "product_selected":
        response = await handleProductSelection(text, ctx);
        break;

      case "quantity_selection":
        response = await handleQuantitySelection(text, ctx);
        break;

      case "cart_review":
        response = await handleCartReview(text, ctx);
        break;

      case "collecting_info":
        response = await handleCollectingInfo(text, ctx);
        break;

      case "confirming_order":
        response = await handleOrderConfirmation(text, ctx);
        break;

      default:
        ctx.step = "menu";
        response = getMainMenu();
    }
  } catch (err) {
    console.error("❌ Error en flujo:", err);
    response = "⚠️ Ocurrió un error. Escribe 'menu' para volver al inicio.";
  }

  await msg.reply(response);
}

// =====================
// FLUJOS
// =====================
async function handleGreeting(ctx: Context) {
  ctx.step = "menu";
  return getMainMenu();
}

async function handleMenu(text: string, ctx: Context) {
  if (["1", "productos", "ver productos", "ver todos los productos"].includes(text)) {
    const products = await api.getAllProducts();
    ctx.step = "product_selected";
    return formatProductList(products);
  }

  if (["2", "carrito", "ver carrito"].includes(text)) {
    return showCart(ctx);
  }

  if (["3", "finalizar", "finalizar pedido"].includes(text)) {
    if (!ctx.cart.length) return "🛒 Tu carrito está vacío.";
    ctx.step = "collecting_info";
    return "Por favor, ingresa tu nombre completo para continuar con el pedido:";
  }

  return "⚠️ Opción no válida. Escribe 1, 2 o 3 o 'menu' para comenzar de nuevo.";
}

async function handleProductSelection(text: string, ctx: Context) {
  const products = await api.getAllProducts();
  const index = parseInt(text) - 1;
  const product = products[index];

  if (!product) {
    return "Número de producto inválido. Intenta nuevamente o escribe 'menu' para volver.";
  }

  ctx.selectedProduct = product;
  ctx.step = "quantity_selection";
  return `Has seleccionado *${product.name}* 💰 S/.${product.price}\n\nIndica la cantidad que deseas agregar:`;
}

async function handleQuantitySelection(text: string, ctx: Context) {
  const quantity = parseInt(text);
  if (isNaN(quantity) || quantity <= 0) {
    return "Por favor, ingresa una cantidad válida.";
  }

  const product = ctx.selectedProduct;
  if (!product) return "Producto no encontrado. Escribe 'menu' para comenzar.";

  ctx.cart.push({
    id: product._id,
    name: product.name,
    price: product.price,
    quantity,
  });

  ctx.step = "cart_review";
  return `${quantity}x ${product.name} agregado al carrito ✅\n\n${showCart(ctx)}`;
}

function showCart(ctx: Context) {
  if (!ctx.cart.length) return "🛒 Tu carrito está vacío.";

  let msg = "🛒 *Tu carrito actual:*\n\n";
  let total = 0;

  ctx.cart.forEach((item, i) => {
    const subtotal = item.quantity * item.price;
    total += subtotal;
    msg += `${i + 1}. ${item.name} - ${item.quantity}x S/.${item.price} = S/.${subtotal}\n`;
  });

  msg += `\n💰 *Total:* S/.${total.toFixed(2)}\n\n1️⃣ Seguir comprando\n2️⃣ Finalizar pedido\n3️⃣ Vaciar carrito`;
  return msg;
}

async function handleCartReview(text: string, ctx: Context) {
  switch (text) {
    case "1":
      ctx.step = "menu";
      return getMainMenu();
    case "2":
      ctx.step = "collecting_info";
      return "Por favor, ingresa tu nombre completo:";
    case "3":
      ctx.cart = [];
      ctx.step = "menu";
      return "🧹 Carrito vaciado. Escribe 'menu' para volver al inicio.";
    default:
      return "Opción no válida. Escribe 1, 2 o 3.";
  }
}

async function handleCollectingInfo(text: string, ctx: Context) {
  if (!ctx.customerData) ctx.customerData = {};

  if (!ctx.customerData.name) {
    ctx.customerData.name = text;
    return "Gracias. Ahora indícame tu dirección de entrega:";
  }

  if (!ctx.customerData.address) {
    ctx.customerData.address = text;
    ctx.step = "confirming_order";

    const total = ctx.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return `📋 *Resumen de tu pedido:*\n${showCart(ctx)}\n\n👤 ${ctx.customerData.name}\n📍 ${ctx.customerData.address}\n\n¿Confirmas tu pedido? (Responde *SI* o *NO*)`;
  }

  return "Error en la información. Escribe 'menu' para reiniciar.";
}

async function handleOrderConfirmation(text: string, ctx: Context) {
  if (["si", "sí"].includes(text)) {
    const order = await api.createOrder({
      customer: ctx.customerData,
      items: ctx.cart,
      total: ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0),
    });

    ctx.cart = [];
    ctx.step = "menu";

    return `✅ Pedido confirmado\nNúmero de orden: ${order.orderNumber || "(sin número)"}\n💰 Total: S/.${order.total}\n\nGracias por tu compra.`;
  }

  if (text === "no") {
    ctx.step = "menu";
    return "Pedido cancelado. Escribe 'menu' para volver al inicio.";
  }

  return "Por favor responde 'SI' o 'NO'.";
}

// =====================
// HELPERS
// =====================
function formatProductList(products: any[]) {
  if (!products.length) return "No hay productos disponibles.";
  let msg = "🛍️ *Productos disponibles:*\n\n";
  products.forEach((p, i) => {
    msg += `${i + 1}. *${p.name}*\n💰 S/. ${p.price}\n📦 Stock: ${p.stock}\n\n`;
  });
  msg += "Envía el número del producto que quieres agregar.";
  return msg;
}

function getMainMenu() {
  return `👋 ¡Hola! Bienvenido a nuestra tienda.

¿Qué deseas hacer hoy?
1️⃣ Ver productos
2️⃣ Ver mi carrito
3️⃣ Finalizar pedido`;
}
