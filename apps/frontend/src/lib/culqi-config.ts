/** Only public encryption material belongs in the browser. */
export function culqiRsaSettings(env: Record<string, string | undefined>) {
  const id = env.VITE_CULQI_RSA_ID?.trim();
  const key = env.VITE_CULQI_RSA_PUBLIC_KEY?.replace(/\\n/g, '\n').trim();
  if (!id || !key) throw new Error('Falta configurar la llave pública RSA y su ID de Culqi');
  if (!/^[a-f0-9-]{36}$/i.test(id) ||
      !/^-----BEGIN (?:RSA )?PUBLIC KEY-----\s+[A-Za-z0-9+/=\s]+\s+-----END (?:RSA )?PUBLIC KEY-----$/.test(key)) {
    throw new Error('Configuración RSA de Culqi inválida: usa el ID y la llave pública PEM completos');
  }
  return { xculqirsaid: id, rsapublickey: key };
}

export function isCulqiCheckoutUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      (!url.port || url.port === '443') &&
      (url.hostname === 'culqi.com' || url.hostname.endsWith('.culqi.com'));
  } catch {
    return false;
  }
}
