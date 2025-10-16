import { Client, Message } from "whatsapp-web.js";

export async function handleMessage(client: Client, msg: Message) {
  const text = msg.body.toLowerCase();

  if (text.includes("hola")) {
    await msg.reply("👋 ¡Hola! Bienvenido a nuestro *catálogo interactivo*.\nEscribe *catálogo* para ver nuestros productos.");
  } else if (text.includes("catálogo")) {
    await msg.reply("📦 Aquí tienes nuestros productos:\n1️⃣ Shampoo\n2️⃣ Crema dental\n3️⃣ Enjuague bucal\n\nResponde con el número para agregar al carrito.");
  } else {
    await msg.reply("🤖 No entendí tu mensaje. Escribe *catálogo* para comenzar.");
  }
}
