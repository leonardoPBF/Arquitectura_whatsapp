import { EventEmitter } from 'node:events';

type LifecycleClient = EventEmitter & {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
};

interface Options {
  startupTimeoutMs: number;
  readyTimeoutMs: number;
  shutdownTimeoutMs?: number;
  log: (message: string) => void;
  exit: (code: number) => void;
}

// One browser per process. A supervisor may restart failures with backoff.
// Never delete LocalAuth here: the library owns logout cleanup.
export function startClient(client: LifecycleClient, options: Options) {
  let stopping = false;
  let authenticated = false;
  let ready = false;
  let phase = 'iniciando navegador';
  let deadline: ReturnType<typeof setTimeout>;

  async function stop(code: number, reason: string) {
    if (stopping) return;
    stopping = true;
    clearTimeout(deadline);
    options.log(`[whatsapp] ${reason}`);
    const forcedExit = setTimeout(() => options.exit(code), options.shutdownTimeoutMs ?? 10_000);
    try {
      await client.destroy();
    } catch (error) {
      options.log(`[whatsapp] Cierre del navegador: ${String(error)}`);
    } finally {
      clearTimeout(forcedExit);
      options.exit(code);
    }
  }

  function armDeadline(timeout: number) {
    clearTimeout(deadline);
    deadline = setTimeout(() => {
      void stop(1, `Tiempo agotado (${phase}). Revisa la red, la versión de WhatsApp Web y los dispositivos vinculados.`);
    }, timeout);
  }

  client.on('qr', () => {
    if (stopping || ready) return;
    phase = 'esperando escaneo y autenticación';
    options.log('[whatsapp] QR disponible; escanéalo desde Dispositivos vinculados.');
  });
  client.on('authenticated', () => {
    if (stopping || ready || authenticated) return;
    authenticated = true;
    phase = 'autenticado; esperando ready';
    options.log('[whatsapp] authenticated: credenciales aceptadas; sincronizando.');
    armDeadline(options.readyTimeoutMs);
  });
  client.on('loading_screen', (percent: number, message: string) => {
    options.log(`[whatsapp] Carga ${percent}%: ${message}`);
  });
  client.on('change_state', (state: string) => options.log(`[whatsapp] Estado: ${state}`));
  client.on('ready', () => {
    if (stopping) return;
    ready = true;
    phase = 'ready';
    clearTimeout(deadline);
    options.log('[whatsapp] ready: conectado y listo.');
  });
  client.on('auth_failure', (message: string) => {
    void stop(1, `auth_failure: ${message}`);
  });
  client.on('disconnected', (reason: string) => {
    void stop(1, `Desconectado: ${reason}. El proceso se cerrará; no se borrará manualmente la sesión.`);
  });

  armDeadline(options.startupTimeoutMs);
  void Promise.resolve().then(() => {
    if (!stopping) return client.initialize();
  }).catch((error: unknown) => {
    void stop(1, `Fallo de inicialización: ${String(error)}`);
  });

  return { stop, isReady: () => ready && !stopping };
}
