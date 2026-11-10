export interface Authentication3DS {
  eci: string; xid: string; cavv: string; protocolVersion: string;
  directoryServerTransactionId?: string;
}
interface Culqi3DSClient {
  publicKey: string;
  settings: { charge: { totalAmount: number; returnUrl: string; currency: string }; card: { email: string } };
  options: Record<string, unknown>;
  generateDevice: () => Promise<string | null>;
  initAuthentication: (token: string) => void;
  reset: () => void;
}
declare global { interface Window { Culqi3DS?: Culqi3DSClient } }
let loading: Promise<Culqi3DSClient> | undefined;
export function loadCulqi3DS(publicKey: string): Promise<Culqi3DSClient> {
  if (window.Culqi3DS) { window.Culqi3DS.publicKey = publicKey; return Promise.resolve(window.Culqi3DS); }
  if (!loading) loading = new Promise<Culqi3DSClient>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => { script.remove(); loading = undefined; reject(new Error('No se pudo cargar la autenticación bancaria')); }, 20000);
    script.src = 'https://3ds.culqi.com'; script.async = true;
    script.onload = () => { clearTimeout(timer); if (window.Culqi3DS) { window.Culqi3DS.publicKey = publicKey; resolve(window.Culqi3DS); } else { loading = undefined; reject(new Error('Autenticación bancaria no disponible')); } };
    script.onerror = () => { clearTimeout(timer); script.remove(); loading = undefined; reject(new Error('No se pudo cargar la autenticación bancaria')); };
    document.body.appendChild(script);
  });
  return loading;
}

export function authenticate3DS(client: Culqi3DSClient, token: string, amount: number, email: string, signal: AbortSignal): Promise<Authentication3DS> {
  return new Promise((resolve, reject) => {
    const finish = (error?: Error, parameters?: Authentication3DS) => {
      clearTimeout(timer); window.removeEventListener('message', receive); signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(parameters!);
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
      if (event.data.error) finish(new Error('El banco no pudo autenticar la compra. Puedes reintentar la autenticación.'));
      else if (event.data.parameters3DS) {
        const p = event.data.parameters3DS;
        if (['eci', 'xid', 'cavv', 'protocolVersion'].every(key => typeof p[key] === 'string' && p[key].length > 0)) finish(undefined, p);
      }
    };
    const abort = () => finish(new Error('Autenticación interrumpida'));
    const timer = setTimeout(() => finish(new Error('La autenticación bancaria venció. Puedes reintentar la autenticación.')), 180000);
    if (signal.aborted) { abort(); return; }
    window.addEventListener('message', receive); signal.addEventListener('abort', abort, { once: true });
    client.settings = { charge: { totalAmount: amount, currency: 'PEN', returnUrl: window.location.href }, card: { email } };
    client.options = { showModal: true, showLoading: true, style: { btnColor: '#305941', btnTextColor: '#ffffff' } };
    try { client.initAuthentication(token); } catch { finish(new Error('No se pudo iniciar la autenticación bancaria')); }
  });
}
