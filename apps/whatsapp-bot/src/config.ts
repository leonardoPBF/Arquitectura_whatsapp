import path from 'node:path';
import dotenv from 'dotenv';

// src/ and dist/ share a parent: paths do not depend on the shell cwd.
export const appRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(appRoot, '.env'), quiet: true });
process.env.PUPPETEER_CACHE_DIR ??= path.resolve(appRoot, '../../.cache/puppeteer');

function positiveTimeout(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0 || value > 2_147_483_647) {
    throw new Error(`${name} debe ser un tiempo positivo en milisegundos`);
  }
  return value;
}

export const config = {
  authPath: path.resolve(appRoot, process.env.WA_AUTH_PATH || '.wwebjs_auth'),
  apiUrl: (process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  headless: process.env.WA_HEADLESS !== 'false',
  noSandbox: process.env.WA_NO_SANDBOX === 'true',
  diagnostic: process.env.WA_DIAGNOSTIC === 'true' || process.argv.includes('--diagnostic'),
  startupTimeoutMs: positiveTimeout('WA_STARTUP_TIMEOUT_MS', 300_000),
  readyTimeoutMs: positiveTimeout('WA_READY_TIMEOUT_MS', 120_000),
};
