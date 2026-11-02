const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const files = {
  mongo: 'docker/mongo/.env.production',
  api: 'apps/api/.env.production',
  nginx: 'docker/nginx/.env.production',
  'whatsapp-bot': 'apps/whatsapp-bot/.env.production',
  'rasa-actions': 'apps/rasa-chatbot/actions/.env.production',
  'rasa-train': 'apps/rasa-chatbot/.env.production',
  rasa: 'apps/rasa-chatbot/.env.production',
};
const publicFiles = ['apps/frontend/.env.production', 'apps/docs/.env.production'];

function compose(...flags) {
  // Never print resolved configuration: it contains credentials.
  return JSON.parse(execFileSync('docker', [
    'compose', '--env-file', '.env.production', 'config', '--format', 'json', ...flags,
  ], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}

try {
  const source = compose('--no-env-resolution');
  const resolved = compose();
  assert.deepEqual(Object.keys(source.services).sort(), Object.keys(files).sort());
  for (const [service, file] of Object.entries(files)) {
    const envFiles = source.services[service].env_file;
    assert.equal(envFiles.length, 1, `${service}: se esperaba un env_file`);
    assert.equal(path.resolve(root, envFiles[0].path || envFiles[0]), path.resolve(root, file));
    const expected = parseEnv(fs.readFileSync(path.join(root, file), 'utf8'));
    for (const [key, value] of Object.entries(expected)) {
      // Do not include actual or expected values in assertion errors.
      assert.ok(resolved.services[service].environment[key] === value,
        `${service}: ${key} difiere del archivo; revisa interpolaciones o sobrescrituras`);
    }
  }
  for (const file of publicFiles) {
    const variables = parseEnv(fs.readFileSync(path.join(root, file), 'utf8'));
    assert.ok(Object.keys(variables).every(key => key.startsWith('VITE_')),
      `${file}: solo se permiten variables públicas VITE_*`);
  }
  for (const file of new Set(['.env.production', ...Object.values(files), ...publicFiles])) {
    assert.ok(fs.existsSync(path.join(root, `${file}.example`)), `Falta plantilla: ${file}.example`);
  }
  console.log('Entorno OK: 7 servicios cargan su .env.production y 2 sitios usan variables públicas de build.');
} catch (error) {
  console.error(error.stdout || error.stderr ? 'No se pudo validar Compose; ejecuta docker compose --env-file .env.production config --quiet.' : error.message);
  process.exitCode = 1;
}
