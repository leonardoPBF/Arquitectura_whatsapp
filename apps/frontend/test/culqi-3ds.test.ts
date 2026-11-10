import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate3DS } from '../src/lib/culqi-3ds.ts';

test('3DS accepts only the invoking origin and removes its listener after completion', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const events = new EventTarget();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { origin: 'https://shop.example', href: 'https://shop.example/checkout?order=fixture' },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
  } });
  try {
    let initiated = '';
    const client = { publicKey: 'fixture', settings: {} as any, options: {}, generateDevice: async () => 'device', reset() {}, initAuthentication(token: string) { initiated = token; } };
    const promise = authenticate3DS(client, 'tkn_test_fixture', 1000, 'fixture@example.test', new AbortController().signal);
    assert.equal(initiated, 'tkn_test_fixture');
    assert.equal(client.settings.charge.totalAmount, 1000);
    const parameters3DS = { eci: '05', xid: 'fixture-xid', cavv: 'fixture-cavv', protocolVersion: '2.1.0' };
    events.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', data: { error: 'forged error' } }));
    events.dispatchEvent(new MessageEvent('message', { origin: 'https://shop.example', data: { parameters3DS } }));
    assert.deepEqual(await promise, parameters3DS);
    const controller = new AbortController();
    const cancelled = authenticate3DS(client, 'tkn_test_fixture', 1000, 'fixture@example.test', controller.signal);
    controller.abort();
    await assert.rejects(cancelled, /interrumpida/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
