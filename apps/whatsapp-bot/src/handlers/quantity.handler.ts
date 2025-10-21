import { api } from "../services/whatsapp.service";
import { showCart } from "../utils/messages";

export async function handleQuantity(ctx: any, text: string) {
  const quantity = parseInt(text);
  if (isNaN(quantity) || quantity <= 0) {
    return "Por favor ingresa una cantidad válida (número mayor que 0).";
  }

  const selected = ctx.selectedProduct;
  if (!selected) return "Producto no encontrado. Escribe 'menu' para comenzar.";

  // obtener versión más reciente del producto desde el backend por si cambió el stock
  let product = selected;
  try {
    if (selected._id) {
      const fresh = await api.getProductById(selected._id);
      if (fresh) product = fresh;
    }
  } catch (err) {
    // si falla la llamada, usamos el producto en sesión
    console.warn("No se pudo obtener producto actualizado, usando datos en sesión");
  }

  if (product.stock == null) {
    // si no hay info de stock, permitimos agregar
    // pero en general product.stock debería existir
  } else if (quantity > product.stock) {
    return `⚠️ Lo siento, solo quedan ${product.stock} unidades disponibles de *${product.name}*. Por favor ingresa una cantidad menor o igual a ${product.stock}.`;
  }

  // persistir el item en backend y sincronizar carrito
  try {
    if (ctx.phone) {
      const updatedConv = await api.addItemToConversationCart(ctx.phone, {
        productId: product._id || product.id,
        productName: product.name,
        quantity,
        price: product.price,
      });

      // actualizar ctx.cart con lo que devuelve el backend (normalizar)
      ctx.cart = (updatedConv.cart || []).map((it: any) => ({
        id: it.productId?.toString() || it._id || it.id,
        productName: it.productName || it.name,
        price: it.price ?? it.unitPrice ?? 0,
        quantity: it.quantity,
        productId: it.productId || it.id || it._id,
      }));
      ctx.step = "cart";

      return `${quantity}x ${product.name} agregado al carrito ✅\n\n${showCart(ctx)}`;
    }
  } catch (err) {
    console.warn("No se pudo agregar item via API, actualizando localmente:", err);
  }

  // fallback local si no se pudo persistir
  if (!ctx.cart) ctx.cart = [];
  ctx.cart.push({
    id: product._id || product.id,
    name: product.name,
    price: product.price,
    quantity,
  });
  ctx.step = "cart";

  return `${quantity}x ${product.name} agregado al carrito ✅\n\n${showCart(ctx)}`;
}
