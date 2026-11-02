const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { startClient } = require('../dist/lifecycle.js');

class FakeClient extends EventEmitter {
  destroyed = 0;
  async initialize() {}
  async destroy() { this.destroyed++; }
}

function setup(t, overrides = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const client = new FakeClient();
  const exits = [];
  const logs = [];
  const lifecycle = startClient(client, {
    startupTimeoutMs: 100,
    readyTimeoutMs: 50,
    log: (message) => logs.push(message),
    exit: (code) => exits.push(code),
    ...overrides,
  });
  return { client, exits, logs, lifecycle };
}

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test('authentication without ready times out instead of hanging', async (t) => {
  const { client, exits, logs } = setup(t);
  await flush();
  client.emit('qr');
  client.emit('authenticated');
  t.mock.timers.tick(51);
  await flush();
  assert.deepEqual(exits, [1]);
  assert.equal(client.destroyed, 1);
  assert.ok(logs.some((line) => line.includes('autenticado; esperando ready')));
});

test('ready cancels the deadline, including duplicate authentication events', async (t) => {
  const { client, exits, lifecycle } = setup(t);
  client.emit('authenticated');
  client.emit('ready');
  client.emit('authenticated');
  t.mock.timers.tick(200);
  await flush();
  assert.deepEqual(exits, []);
  assert.equal(lifecycle.isReady(), true);
  await lifecycle.stop(0, 'test complete');
});

test('QR rotations do not extend the startup timeout', async (t) => {
  const { client, exits } = setup(t);
  client.emit('qr');
  t.mock.timers.tick(60);
  client.emit('qr');
  t.mock.timers.tick(41);
  await flush();
  assert.deepEqual(exits, [1]);
});

test('duplicate authenticated events do not extend the ready timeout', async (t) => {
  const { client, exits } = setup(t);
  client.emit('authenticated');
  t.mock.timers.tick(30);
  client.emit('authenticated');
  t.mock.timers.tick(21);
  await flush();
  assert.deepEqual(exits, [1]);
});

test('initialize rejection is reported and closes the browser', async (t) => {
  const { client, exits, logs } = setup(t);
  client.initialize = async () => { throw new Error('browser missing'); };
  await flush();
  assert.deepEqual(exits, [1]);
  assert.equal(client.destroyed, 1);
  assert.ok(logs.some((line) => line.includes('browser missing')));
});

for (const reason of ['LOGOUT', 'CONFLICT', 'UNPAIRED']) {
  test(`disconnect ${reason} exits once, without spawning another client`, async (t) => {
    const { client, exits, lifecycle } = setup(t);
    client.emit('ready');
    client.emit('disconnected', reason);
    client.emit('disconnected', reason);
    await flush();
    assert.deepEqual(exits, [1]);
    assert.equal(client.destroyed, 1);
    assert.equal(lifecycle.isReady(), false);
  });
}

test('auth failure and browser-close errors still produce a failed exit', async (t) => {
  const { client, exits } = setup(t);
  client.destroy = async () => { throw new Error('Target closed'); };
  client.emit('auth_failure', 'invalid credentials');
  await flush();
  assert.deepEqual(exits, [1]);
});

test('shutdown is bounded when Chromium never closes', async (t) => {
  const { client, exits, lifecycle } = setup(t, { shutdownTimeoutMs: 20 });
  client.destroy = () => new Promise(() => {});
  void lifecycle.stop(1, 'test');
  t.mock.timers.tick(21);
  assert.deepEqual(exits, [1]);
});
