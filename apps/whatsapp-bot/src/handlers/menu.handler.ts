import { api } from "../services/whatsapp.service";
import { formatProductList, getCommandsHelp } from "../utils/messages";
import { showCart } from "../utils/messages";

export async function handleMenu(ctx: any, text: string) {
  if (["1", "productos"].includes(text)) {
    const products = await api.getAllProducts();
    ctx.step = "product";
    return formatProductList(products);
  }

  if (["2", "carrito"].includes(text)) {
    ctx.step = "cart";
    return showCart(ctx);
  }

  if (["3", "finalizar"].includes(text)) {
    if (!ctx.cart?.length) return "🛒 Tu carrito está vacío.";
    ctx.step = "order";
    return "Por favor, ingresa tu nombre completo para continuar:";
  }

  if (["ayuda"].includes(text)) {
    return getCommandsHelp();
  }

  return "Opción no válida. Escribe 1, 2 o 3 (o escribe 'ayuda' para ver comandos).";
}
