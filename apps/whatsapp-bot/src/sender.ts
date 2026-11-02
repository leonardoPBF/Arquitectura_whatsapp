import type { Client } from 'whatsapp-web.js';

export async function resolveSenderPhone(
  client: Pick<Client, 'getContactLidAndPhone'>,
  sender: string,
): Promise<string | undefined> {
  if (sender.endsWith('@c.us')) return sender.replace(/@c\.us$/, '');
  if (!sender.endsWith('@lid')) return undefined;
  const [mapping] = await client.getContactLidAndPhone([sender]);
  // A LID is not a telephone number, even if it contains only digits.
  return mapping?.pn?.endsWith('@c.us') ? mapping.pn.replace(/@c\.us$/, '') : undefined;
}
