import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import mongoose from "mongoose";
import User, { IUser } from "./models/user";
import dotenv from "dotenv";

dotenv.config();
// 🔹 Conectar a MongoDB
const connectionString = process.env.CONECTION;
if (!connectionString) {
  throw new Error("❌ CONECTION_STRING no está definido en las variables de entorno.");
}
mongoose.connect(connectionString)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error MongoDB:", err));

// 🔹 Inicializar WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on("qr", (qr: string) => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Escanea el QR con WhatsApp");
});

client.on("ready", () => {
  console.log("🤖 Bot conectado a WhatsApp");
});

// 🔹 Guardar mensajes en DB
client.on("message", async (msg: Message) => {
  const number = msg.from;
  const text = msg.body;
  msg.author && console.log(`👤 ${msg.author} in ${msg.from}: ${text}`);

  console.log(`📩 ${number}: ${text}`);

  let user: IUser | null = await User.findOne({ number });

  if (!user) {
    user = new User({ number, name: "Desconocido", lastMessage: text });
  } else {
    user.lastMessage = text;
  }

  await user.save();

  if (text.toLowerCase() === "hola") {
    await msg.reply("👋 Hola! Te registré en la base de datos ✅");
  }
});

client.initialize();
