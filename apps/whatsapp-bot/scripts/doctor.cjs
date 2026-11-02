const fs = require('node:fs');
const { createRequire } = require('node:module');
const { config } = require('../dist/config.js');
const waRequire = createRequire(require.resolve('whatsapp-web.js'));
const puppeteer = waRequire('puppeteer');

async function main() {
  const executablePath = config.executablePath || puppeteer.executablePath();
  console.log('Node:', process.version);
  console.log('whatsapp-web.js:', waRequire('whatsapp-web.js/package.json').version);
  console.log('Puppeteer realmente utilizado:', waRequire('puppeteer/package.json').version);
  console.log('Sesión:', config.authPath);
  console.log('Navegador:', executablePath);
  if (!fs.existsSync(executablePath)) {
    throw new Error('Falta Chrome. Ejecuta desde la raíz: npx puppeteer browsers install chrome');
  }
  if (process.argv.includes('--launch')) {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: config.noSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
    });
    try {
      console.log('Chrome inicia correctamente:', await browser.version());
    } finally {
      await browser.close();
    }
  }
  console.log('Diagnóstico local OK. Esto no verifica la vinculación del teléfono.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
