import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { handleMessage } from "./handlers/SalesBotHandler.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch((err) => console.error("❌ Error de conexión MongoDB:", err));

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("🤖 Bot de WhatsApp conectado y listo");
});

client.on("message", async (msg) => {
  try {
    const contact = await msg.getContact();
    const number = contact.number; // ✅ Número sin el @c.us
    const name = contact.pushname || contact.name || "Desconocido";

    console.log(`📩 Mensaje recibido de ${name} (${number}): ${msg.body}`);

    // Ahora puedes pasar esta info al manejador de mensajes
    await handleMessage(client, msg );
  } catch (err) {
    console.error("⚠️ Error al procesar el mensaje:", err);
  }
});

client.initialize();
