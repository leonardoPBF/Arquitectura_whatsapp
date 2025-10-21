import { Client, Message, MessageMedia } from "whatsapp-web.js";
import { getMainMenu } from "../utils/messages";
import { api } from "../services/whatsapp.service";
import { getSession, updateSession } from "../utils/context";

import { handleGreeting } from "./greeting.handler";
import { handleMenu } from "./menu.handler";
import { handleProduct } from "./product.handler";
import { handleCart } from "./cart.handler";
import { handleQuantity } from "./quantity.handler";
import { handleOrder } from "./order.handler";

export async function handleMessage(client: Client, msg: Message) {
  const phone = msg.from.replace("@c.us", "");
  const text = msg.body.trim().toLowerCase();

  let session = getSession(phone);
  if (!session) {
    // intentar rehidratar sesión desde backend
    session = { step: "greeting", cart: [], phone, contactName: undefined };
    try {
      const conv = await api.getConversationByPhone(phone);
      if (conv) {
        // normalizar items del carrito
        session.cart = (conv.cart || []).map((it: any) => ({
          id: it.productId?.toString() || it.id || it._id || undefined,
          productName: it.productName || it.name || it.productName,
          price: it.price ?? it.unitPrice ?? 0,
          quantity: it.quantity ?? 0,
          productId: it.productId || it.id || it._id,
        }));
        session.step = conv.currentStep || "menu";
        // ensure phone/contactName available for handlers
        session.phone = phone;
        session.contactName = conv.contactName || session.contactName;
      }
    } catch (err) {
      // no existe en backend o error, quedamos en greeting por defecto
    }
  }

  // comandos globales para reiniciar flujo (tienen prioridad)
  if (["menu", "inicio", "volver", "exit", "salir"].includes(text)) {
    session.step = "menu";
    session.orderPhase = undefined;
    updateSession(phone, session);
    await msg.reply(getMainMenu());
    return;
  }

  // ayuda global (texto solamente, los números están reservados para seleccionar productos)
  if (text === "ayuda") {
    const { getCommandsHelp } = await import("../utils/messages");
    await msg.reply(getCommandsHelp());
    return;
  }

  // atajos globales de texto (productos, carrito, finalizar)
  if (["productos", "ver productos"].includes(text)) {
    // delegar al menu con la opción 1
    session.step = "product";
    updateSession(phone, session);
    const resp = await handleMenu(session, "1");
    await msg.reply(resp as any);
    return;
  }

  if (["carrito", "ver carrito"].includes(text)) {
    session.step = "cart";
    updateSession(phone, session);
    const resp = await handleMenu(session, "2");
    await msg.reply(resp as any);
    return;
  }

  if (["finalizar"].includes(text)) {
    session.step = "order";
    updateSession(phone, session);
    const resp = await handleMenu(session, "3");
    await msg.reply(resp as any);
    return;
  }

  // vaciar carrito: iniciamos confirmación global si no hay confirmación en curso
  if (text === "vaciar carrito" || text === "vaciar" || text === "vaciarcarrito") {
    if (!session.cart || !session.cart.length) {
      await msg.reply("🛒 Tu carrito está vacío.");
      return;
    }
    session.pendingClear = true;
    updateSession(phone, session);
    await msg.reply("⚠️ ¿Seguro que deseas vaciar tu carrito? Responde 'SI' para confirmar o 'NO' para cancelar.");
    return;
  }

  // si estamos en confirmación de vaciado de carrito
  if (session.pendingClear) {
    if (["si", "sí"].includes(text)) {
      try {
        if (session.phone) await api.clearConversationCart(session.phone);
      } catch (err) {
        console.error("Error clearing backend cart:", err);
      }
      session.cart = [];
      session.pendingClear = false;
      session.step = "menu";
      updateSession(phone, session);
      await msg.reply("🧹 Carrito vaciado correctamente. Escribe 'menu' para volver al inicio.");
      return;
    }
    if (text === "no") {
      session.pendingClear = false;
      updateSession(phone, session);
      await msg.reply("Operación cancelada. Tu carrito se mantiene.");
      return;
    }
    // si la respuesta no es SI/NO, pedir que confirme
    await msg.reply("Por favor responde 'SI' o 'NO' para confirmar el vaciado del carrito.");
    return;
  }

  try {

  // response can be string or an object { type: 'media', mediaUrl, caption }
  let response: any = "";

    switch (session.step) {
      case "greeting":
        response = await handleGreeting(session);
        break;
      case "menu":
        response = await handleMenu(session, text);
        break;
      case "product":
        response = await handleProduct(session, text);
        break;
      case "quantity_selection":
        response = await handleQuantity(session, text);
        break;
      case "cart":
        response = await handleCart(session, text);
        break;
      case "order":
        response = await handleOrder(session, text);
        break;
      default:
        response = getMainMenu();
        session.step = "menu";
    }

    updateSession(phone, session);

    // soportar array de respuestas
    if (Array.isArray(response)) {
      for (const r of response) {
        if (r && typeof r === "object" && r.type === "media" && r.mediaUrl) {
          try {
            const media = await MessageMedia.fromUrl(r.mediaUrl);
            if (r.caption) {
              await msg.reply(media, undefined, { caption: r.caption });
            } else {
              await msg.reply(media);
            }
          } catch (err) {
            console.error("Error al descargar/enviar media:", err);
            if (r.caption) await msg.reply(r.caption);
          }
        } else if (r && typeof r === "object" && r.type === "text" && r.text) {
          await msg.reply(r.text);
        } else if (typeof r === "string") {
          await msg.reply(r);
        }
      }
    } else {
      // si el handler devolvió un media, enviarlo como media + caption
      if (response && typeof response === "object" && response.type === "media" && response.mediaUrl) {
        try {
          const media = await MessageMedia.fromUrl(response.mediaUrl);
          if (response.caption) {
            await msg.reply(media, undefined, { caption: response.caption });
          } else {
            await msg.reply(media);
          }
        } catch (err) {
          console.error("Error al descargar/enviar media:", err);
          if (response.caption) await msg.reply(response.caption);
          else await msg.reply("No se pudo enviar la imagen.");
        }
      } else {
        await msg.reply(response);
      }
    }

  } catch (err) {
    console.error("❌ Error en flujo:", err);
    await msg.reply("⚠️ Ocurrió un error. Escribe 'menu' para volver al inicio.");
  }
}
