import { test } from 'node:test';
import assert from 'node:assert/strict';
import { takePurchasedCart } from '../src/lib/purchased-cart.ts';

test('paid purchase snapshots are isolated by user and order and consumed once', () => {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const descriptors = ['localStorage', 'sessionStorage'].map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  for (const [name, map] of [['localStorage', local], ['sessionStorage', session]] as const) {
    Object.defineProperty(globalThis, name, { configurable: true, value: {
      getItem: (key: string) => map.get(key) ?? null,
      removeItem: (key: string) => map.delete(key),
    } });
  }
  try {
    const items = [{ _id: 'product', name: 'Product', price: 20, quantity: 2 }];
    local.set('purchase:alice:order', JSON.stringify({ items, storageKey: 'attempt' }));
    session.set('attempt', 'retry-key');
    assert.deepEqual(takePurchasedCart('bob', 'order'), []);
    assert.deepEqual(takePurchasedCart('alice', 'other'), []);
    assert.deepEqual(takePurchasedCart('alice', 'order'), items);
    assert.equal(session.has('attempt'), false);
    assert.deepEqual(takePurchasedCart('alice', 'order'), []);
    local.set('purchase:alice:invalid', '{broken');
    assert.deepEqual(takePurchasedCart('alice', 'invalid'), []);
  } finally {
    ['localStorage', 'sessionStorage'].forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
});
