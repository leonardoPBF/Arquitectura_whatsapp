import axios from 'axios';
import { Request, Response } from 'express';
import { identity } from '../middlewares/security';

export const sendMessageToRasa = async (req: Request, res: Response) => {
  const { message, conversationId = 'default' } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 2000 ||
      typeof conversationId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(conversationId)) {
    return res.status(400).json({ error: 'Mensaje o conversación inválidos (máximo 2000 caracteres)' });
  }
  const principal = identity(res);
  const sender = `admin:${principal.id}:${principal.session}:${conversationId}`;
  try {
    const response = await axios.post(
      `${(process.env.RASA_URL || 'http://localhost:5005').replace(/\/$/, '')}/webhooks/rest/webhook`,
      { sender, message: message.trim() }, { timeout: 20000, maxContentLength: 256 * 1024 });
    const replies = Array.isArray(response.data) ? response.data : [];
    return res.json(replies.map((reply: { text?: unknown }) => ({ text: typeof reply.text === 'string' ? reply.text.slice(0, 8000) : '' })));
  } catch {
    return res.status(503).json({ error: 'El asistente no está disponible. Intenta nuevamente.' });
  }
};
