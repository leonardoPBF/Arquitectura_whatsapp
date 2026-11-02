const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { parseEnv } = require('node:util');
const root = path.resolve(__dirname, '..');
// Preserve the settings from the previous Docker configuration on first migration.
// Values are read locally and are never printed. Existing production files win.
const legacyPath = path.join(root, '.env.docker');
const legacy = fs.existsSync(legacyPath) ? parseEnv(fs.readFileSync(legacyPath, 'utf8')) : {};
const folders = ['', 'apps/api', 'apps/frontend', 'apps/docs', 'apps/whatsapp-bot',
  'apps/rasa-chatbot', 'apps/rasa-chatbot/actions', 'docker/mongo', 'docker/nginx'];
const mapping = {
  '': ['COMPOSE_PROJECT_NAME', 'HTTP_BIND', 'FRONTEND_PORT', 'DOCS_PORT'],
  'apps/api': ['JWT_SECRET', 'CORS_ORIGINS', 'CULQI_PRIVATE_KEY', 'CULQI_PUBLIC_KEY', 'GOOGLE_SHEET_ID'],
  'apps/whatsapp-bot': ['WA_DIAGNOSTIC', 'WA_STARTUP_TIMEOUT_MS', 'WA_READY_TIMEOUT_MS'],
};
function replaceValue(template, key, value) {
  return template.replace(new RegExp(`^${key}=.*$`, 'm'), () => `${key}=${JSON.stringify(value)}`);
}
for (const folder of folders) {
  const target = path.join(root, folder, '.env.production');
  if (fs.existsSync(target)) {
    console.log(`Se conserva: ${folder || '.'}/.env.production`);
    continue;
  }
  let template = fs.readFileSync(`${target}.example`, 'utf8');
  for (const key of mapping[folder] || []) {
    if (legacy[key] !== undefined && legacy[key] !== '') template = replaceValue(template, key, legacy[key]);
  }
  if (folder === 'apps/api') {
    if (!legacy.JWT_SECRET || legacy.JWT_SECRET === 'replace-with-a-random-secret') {
      template = replaceValue(template, 'JWT_SECRET', randomBytes(48).toString('hex'));
    }
    if (legacy.CULQI_PRIVATE_KEY) template = replaceValue(template, 'CULQI_SECRET', legacy.CULQI_PRIVATE_KEY);
  }
  if (['apps/api', 'apps/whatsapp-bot'].includes(folder) && legacy.PUBLIC_CHECKOUT_URL) {
    template = replaceValue(template, 'LOCAL_LINK', legacy.PUBLIC_CHECKOUT_URL);
  }
  if (folder === 'apps/frontend' && legacy.CULQI_PUBLIC_KEY) {
    template = replaceValue(template, 'VITE_CULQI_PUBLIC_KEY', legacy.CULQI_PUBLIC_KEY);
  }
  fs.writeFileSync(target, template, { mode: 0o600, flag: 'wx' });
  console.log(`Creado: ${folder || '.'}/.env.production`);
}

// Pair private service credentials without rotating or printing existing values.
for (const [key, consumer] of [['RASA_ACTIONS_TOKEN', 'apps/rasa-chatbot/actions'], ['WA_SERVICE_TOKEN', 'apps/whatsapp-bot']]) {
  const paths = ['apps/api', consumer].map(folder => path.join(root, folder, '.env.production'));
  const contents = paths.map(file => fs.readFileSync(file, 'utf8'));
  const values = contents.map(content => parseEnv(content)[key]).filter(value => value && value !== 'GENERATE_RANDOM_SECRET');
  if (values.some(value => value.length < 32) || new Set(values).size > 1) {
    throw new Error(`${key}: configura el mismo secreto de al menos 32 caracteres en API y servicio`);
  }
  const value = values[0] || randomBytes(48).toString('hex');
  contents.forEach((content, index) => {
    if (parseEnv(content)[key] === value) return;
    const updated = new RegExp(`^${key}=`, 'm').test(content)
      ? replaceValue(content, key, value) : `${content.trimEnd()}\n${key}=${JSON.stringify(value)}\n`;
    fs.writeFileSync(paths[index], updated, { mode: 0o600 });
  });
  console.log(`Credencial de servicio configurada: ${key}`);
}
