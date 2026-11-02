const assert = require('node:assert/strict');
const frontend = process.env.SMOKE_FRONTEND_URL || 'http://127.0.0.1:8080';
const landing = process.env.SMOKE_DOCS_URL || 'http://127.0.0.1:8081';

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response;
}

async function main() {
  assert.equal((await (await get(`${frontend}/health/ready`)).json()).status, 'ready');
  assert.ok(Array.isArray(await (await get(`${frontend}/api/products`)).json()));
  for (const path of ['/api/orders', '/api/customers', '/api/payments']) {
    const response = await fetch(`${frontend}${path}`, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 401, `${path} debe exigir autenticación`);
  }
  for (const url of [`${frontend}/login`, `${frontend}/my-orders`, `${landing}/`]) {
    const response = await get(url);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /id="root"/);
    const script = html.match(/src="(\/assets\/[^"]+\.js)"/);
    assert.ok(script, `Missing compiled entrypoint: ${url}`);
    const asset = await get(new URL(script[1], url));
    assert.match(asset.headers.get('content-type'), /javascript/);
  }
  console.log('Smoke OK: Nginx, ambas SPA, assets, API y MongoDB. Sin pagos ni mensajes externos.');
  if (process.argv.includes('--rasa')) {
    assert.ok(process.env.SMOKE_ADMIN_TOKEN, 'Configura SMOKE_ADMIN_TOKEN con una sesión administrativa válida para probar Rasa por la API');
    const response = await fetch(`${frontend}/api/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SMOKE_ADMIN_TOKEN}` },
      body: JSON.stringify({ sender: 'docker-smoke', message: 'hola' }),
      signal: AbortSignal.timeout(35000),
    });
    assert.equal(response.status, 200);
    const replies = await response.json();
    assert.ok(Array.isArray(replies) && replies.some(reply => /hola|bienvenido/i.test(reply.text)),
      'Rasa no devolvió el saludo esperado');
    console.log('Smoke Rasa OK: Nginx -> API -> Rasa -> respuesta del asistente.');
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
