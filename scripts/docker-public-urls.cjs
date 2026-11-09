const fs = require('node:fs');
const path = require('node:path');

function origin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Usa un origen http(s) sin credenciales, rutas ni parámetros');
  }
  return url.origin;
}

try {
  const frontend = origin(process.argv[2]);
  const docs = process.argv[3] ? origin(process.argv[3]) : frontend;
  const updates = [
    ['apps/api/.env.production', { LOCAL_LINK: `${frontend}/checkout`, CORS_ORIGINS: [...new Set([frontend, docs])].join(',') }],
    ['apps/whatsapp-bot/.env.production', { LOCAL_LINK: `${frontend}/checkout` }],
  ];
  // Read and validate all files before changing any of them.
  const prepared = updates.map(([file, values]) => {
    const target = path.resolve(__dirname, '..', file);
    let content = fs.readFileSync(target, 'utf8');
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const line = `${key}=${JSON.stringify(value)}`;
      content = regex.test(content) ? content.replace(regex, () => line) : `${content.trimEnd()}\n${line}\n`;
    }
    return [target, content];
  });
  for (const [target, content] of prepared) fs.writeFileSync(target, content, { mode: 0o600 });
  console.log('LOCAL_LINK y CORS_ORIGINS actualizados. Recrea API y bot para aplicar los cambios.');
} catch {
  console.error('Uso: node scripts/docker-public-urls.cjs ORIGEN_FRONTEND [ORIGEN_DOCS]. Genera primero los .env.production.');
  process.exitCode = 1;
}
