export function getMainMenu() {
  return `👋 ¡Hola! Bienvenido a nuestra tienda.

¿Qué deseas hacer hoy?
1️⃣ Ver productos
2️⃣ Ver mi carrito
3️⃣ Finalizar pedido

Escribe 'ayuda' para ver los comandos disponibles (usa texto, no números).`;
}

export function getCommandsHelp() {
  return `📚 Comandos disponibles:
- menu: Volver al menú principal
- productos / 1: Listar los productos disponibles
- carrito / 2: Ver tu carrito actual
- finalizar / 3: Iniciar el proceso de pago
- vaciar carrito: Eliminar todos los artículos del carrito
- volver: Regresar al paso anterior
- ayuda: Mostrar esta lista de comandos
- salir: Cancelar la operación y reiniciar

Usa los números (1, 2, 3) únicamente para seleccionar productos/acciones del menú. Para ver los comandos escribe 'ayuda' (texto).`;

}

export function formatProductList(products: any[]) {
  if (!products.length) return 'No hay productos disponibles.';

  // Devolver un array de mensajes: cada producto como media (si tiene imageUrl) con caption
  const messages: any[] = [];

  products.forEach((p, i) => {
    const caption = `${i + 1}. *${p.name}*\n💰 S/. ${p.price}\n📦 Stock: ${p.stock}\n\n${p.description || ''}`;

    if (p.imageUrl) {
      messages.push({ type: 'media', mediaUrl: p.imageUrl, caption });
    } else {
      messages.push({ type: 'text', text: caption });
    }
  });

  // Mensaje final con instrucciones
  messages.push({ type: 'text', text: 'Envía el número del producto que quieres agregar.' });

  return messages;
}

export function invalidOption() {
  return '⚠️ Opción no válida. Escribe \'menu\' para comenzar de nuevo.';
}

export function showCart(ctx: any) {
  if (!ctx.cart.length) return '🛒 Tu carrito está vacío.';

  let msg = '🛒 *Tu carrito actual:*\n\n';
  let total = 0;

  ctx.cart.forEach((item: { quantity: number; price: number; name?: any; productName?: any; }, i: number) => {
    const subtotal = item.quantity * item.price;
    total += subtotal;
    const name = item.productName || item.name || '(producto)';
    msg += `${i + 1}. ${name} - ${item.quantity}x S/.${item.price} = S/.${subtotal}\n`;
  });

  msg += `\n💰 *Total:* S/.${total.toFixed(2)}\n\n1️⃣ Seguir comprando\n2️⃣ Finalizar pedido\n3️⃣ Vaciar carrito`;
  return msg;
}
