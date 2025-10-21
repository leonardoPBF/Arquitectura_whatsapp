import { api } from "../services/whatsapp.service";
import { formatProductList, getMainMenu } from "../utils/messages";

export async function handleCart(ctx: any, text: string) {
  switch (text) {
    case "1":
      // Seguir comprando: mostrar directamente la lista de productos (con imágenes)
      try {
        const products = await api.getAllProducts();
        ctx.step = "product";
        return formatProductList(products);
      } catch (err) {
        console.error("Error obteniendo productos:", err);
        ctx.step = "menu";
        return getMainMenu();
      }
    case "2":
      // Iniciar flujo de pedido
      ctx.step = "order";
      return "Por favor, ingresa tu nombre completo para continuar:";
    case "3":
      // Primero intentamos vaciar el carrito en el backend si tenemos el phone
      try {
        if (ctx.phone) {
          await api.clearConversationCart(ctx.phone);
        }
      } catch (err) {
        console.warn("No se pudo vaciar carrito en backend, se vacía localmente:", err);
      }

      ctx.cart = [];
      ctx.step = "menu";
      return "🧹 Carrito vaciado. Escribe 'menu' para volver al inicio.";
    default:
      return "Opción no válida. Escribe 1, 2 o 3.";
  }
}