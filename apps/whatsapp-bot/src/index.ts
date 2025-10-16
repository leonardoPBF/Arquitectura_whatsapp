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
  await handleMessage(client, msg);
});

client.initialize();
