import { config } from './config';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { handleMessage } from './handlers/index';
import { startClient } from './lifecycle';
import { resolveSenderPhone } from './sender';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: config.authPath, rmMaxRetries: 10 }),
  authTimeoutMs: config.readyTimeoutMs,
  // Use the live web version, not HTML previously cached in the repository.
  webVersionCache: { type: 'none' },
  puppeteer: {
    headless: config.headless,
    executablePath: config.executablePath,
    args: config.noSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  },
});

console.log(`[whatsapp] PID ${process.pid}; sesión: ${config.authPath}`);
console.log(`[whatsapp] Modo: ${config.diagnostic ? 'diagnóstico (sin responder mensajes)' : 'ventas'}`);
client.on('qr', (qr: string) => qrcode.generate(qr, { small: true }));

const lifecycle = startClient(client, {
  startupTimeoutMs: config.startupTimeoutMs,
  readyTimeoutMs: config.readyTimeoutMs,
  log: console.log,
  exit: (code) => process.exit(code),
});

if (!config.diagnostic) {
  client.on('message', async (msg) => {
    if (!lifecycle.isReady() || msg.fromMe || msg.isStatus || msg.from.endsWith('@g.us')) return;
    try {
      const contact = await msg.getContact();
      // Use the same resolved phone key in every handler, including LID senders.
      const phone = await resolveSenderPhone(client, msg.from);
      if (!phone || !/^\d+$/.test(phone)) {
        console.warn('[whatsapp] No se pudo resolver el teléfono del remitente.');
        return;
      }
      await handleMessage(client, msg, {
        phone,
        name: contact.pushname || contact.name || 'Desconocido',
      });
    } catch (error) {
      console.error('[whatsapp] Error procesando mensaje:', error);
    }
  });
}

process.once('SIGINT', () => void lifecycle.stop(0, 'Cierre solicitado (SIGINT).'));
process.once('SIGTERM', () => void lifecycle.stop(0, 'Cierre solicitado (SIGTERM).'));
process.on('uncaughtException', (error) => void lifecycle.stop(1, `Error no capturado: ${String(error)}`));
process.on('unhandledRejection', (error: unknown) => void lifecycle.stop(1, `Promesa rechazada: ${String(error)}`));
